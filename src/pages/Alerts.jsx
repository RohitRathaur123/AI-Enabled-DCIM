// Alerts.jsx
import React, { useState } from 'react';
import { 
  Card, Row, Col, Table, Tag, Space, Button, 
  Badge, Statistic, message, Typography
} from 'antd';
import { 
  AlertOutlined, 
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  EnvironmentOutlined,
  SyncOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text } = Typography;

// Static DCIM alerts data - reduced columns and data
const alertsData = [
  {
    id: 1,
    timestamp: moment().subtract(5, 'minutes'),
    type: 'UPS Overload',
    location: 'Data Center 1',
    severity: 'critical',
    status: 'active',
    value: '92%',
  },
  {
    id: 2,
    timestamp: moment().subtract(25, 'minutes'),
    type: 'High Temperature',
    location: 'Server Room A',
    severity: 'high',
    status: 'acknowledged',
    value: '82°F',
  },
  {
    id: 3,
    timestamp: moment().subtract(2, 'hours'),
    type: 'Disk Failure',
    location: 'Rack A05',
    severity: 'critical',
    status: 'active',
    value: 'Disk 3 failed',
  },
  {
    id: 4,
    timestamp: moment().subtract(4, 'hours'),
    type: 'Low Humidity',
    location: 'Data Center 2',
    severity: 'medium',
    status: 'active',
    value: '35%',
  },
  {
    id: 5,
    timestamp: moment().subtract(1, 'day'),
    type: 'Power Supply Failed',
    location: 'Rack B08',
    severity: 'high',
    status: 'resolved',
    value: 'PSU 1 failed',
  },
  {
    id: 6,
    timestamp: moment().subtract(30, 'minutes'),
    type: 'Network Link Down',
    location: 'Core Switch',
    severity: 'critical',
    status: 'active',
    value: 'Port 48 down',
  },
  {
    id: 7,
    timestamp: moment().subtract(3, 'hours'),
    type: 'Fan Failure',
    location: 'Storage Array',
    severity: 'medium',
    status: 'acknowledged',
    value: 'Fan 4 - 0 RPM',
  },
  {
    id: 8,
    timestamp: moment().subtract(12, 'hours'),
    type: 'Chiller Warning',
    location: 'Mechanical Room',
    severity: 'low',
    status: 'resolved',
    value: 'Pressure high',
  },
];

const Alerts = () => {
  const [alerts, setAlerts] = useState(alertsData);

  // Handle acknowledge
  const handleAcknowledge = (id) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, status: 'acknowledged' } : alert
    ));
    message.success('Alert acknowledged');
  };

  // Handle resolve
  const handleResolve = (id) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, status: 'resolved' } : alert
    ));
    message.success('Alert resolved');
  };

  // Calculate statistics
  const stats = {
    total: alerts.length,
    active: alerts.filter(a => a.status === 'active').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
  };

  // Table columns - compact version
  const columns = [
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 90,
      render: (severity) => {
        const colors = {
          critical: { color: '#f5222d', text: 'Critical' },
          high: { color: '#ff4d4f', text: 'High' },
          medium: { color: '#faad14', text: 'Medium' },
          low: { color: '#52c41a', text: 'Low' },
        };
        return <Tag color={colors[severity].color}>{colors[severity].text}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
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
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <Space size="small">
          {record.status === 'active' && (
            <Button size="small" onClick={() => handleAcknowledge(record.id)}>
              Ack
            </Button>
          )}
          {(record.status === 'active' || record.status === 'acknowledged') && (
            <Button 
              size="small" 
              type="primary" 
              danger={record.status === 'active'}
              onClick={() => handleResolve(record.id)}
            >
              Resolve
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header with large title */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, color: '#000' }}>
          <AlertOutlined style={{ marginRight: 12, color:'#1890ff' }} />
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

      {/* Toolbar */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space>
            <Badge status="error" text={`${stats.active} Active`} />
            <Badge status="warning" text={`${stats.acknowledged} Acknowledged`} />
            <Badge status="success" text={`${stats.resolved} Resolved`} />
          </Space>
        </Col>
        <Col>
          <Button 
            icon={<SyncOutlined />} 
            onClick={() => setAlerts([...alertsData])}
            size="large"
          >
            Refresh
          </Button>
        </Col>
      </Row>

      {/* Table */}
      <Card>
        <Table 
          columns={columns}
          dataSource={alerts}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          size="middle"
          scroll={{ x: false }}
        />
      </Card>

   
    </div>
  );
};

export default Alerts;