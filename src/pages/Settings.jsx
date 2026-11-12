// Settings.jsx
import React, { useState } from 'react';
import { 
  Card, Row, Col, Typography, Form, Switch, InputNumber, 
  Select, Button, Divider, Space, Tag
} from 'antd';
import { 
  SettingOutlined, BellOutlined, UserOutlined, 
  DashboardOutlined, SaveOutlined, CloudOutlined,
  ThunderboltOutlined, HeatMapOutlined, WarningOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const Settings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [settingsType, setSettingsType] = useState('general'); // 'general', 'power', 'cooling', 'environmental'

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  };

  const getInitialValues = () => ({
    // General Settings
    dataRefreshRate: 5,
    temperatureUnit: 'celsius',
    theme: 'light',
    language: 'english',
    dateFormat: 'MM/DD/YYYY',
    dataRetention: 30,
    autoBackup: true,
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    
    // Alert Thresholds
    tempWarning: 80,
    tempCritical: 85,
    humidityWarning: 55,
    humidityCritical: 60,
    powerWarning: 80,
    powerCritical: 90,
    
    // Power Settings
    upsMonitoring: true,
    pduMonitoring: true,
    generatorMonitoring: true,
    powerQualityMonitoring: false,
    
    // Cooling Settings
    cracMonitoring: true,
    crahMonitoring: true,
    chillerMonitoring: true,
    pumpMonitoring: false,
    
    // Environmental Settings
    tempSensors: true,
    humiditySensors: true,
    waterLeakDetection: true,
    smokeDetection: true,
  });

  const settingTypes = [
    { value: 'general', label: 'General', icon: <SettingOutlined /> },
    { value: 'power', label: 'Power', icon: <ThunderboltOutlined /> },
    { value: 'cooling', label: 'Cooling', icon: <HeatMapOutlined /> },
    { value: 'environmental', label: 'Environmental', icon: <WarningOutlined /> },
  ];

  return (
    <div style={{ padding: 24, backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={2} style={{ margin: 0, color: '#000' }}>
              <SettingOutlined style={{ marginRight: 12, color: '#1890ff' }} />
              DCIM Settings
            </Title>
            <Text type="secondary" style={{ fontSize: 16 }}>
              Configure your data center infrastructure monitoring preferences
            </Text>
          </Col>
          <Col>
            <Space>
              <Select
                value={settingsType}
                onChange={setSettingsType}
                style={{ width: 150 }}
                size="large"
              >
                {settingTypes.map(type => (
                  <Option key={type.value} value={type.value}>
                    <Space>{type.icon} {type.label}</Space>
                  </Option>
                ))}
              </Select>
              <Button 
                type="primary" 
                icon={<SaveOutlined />} 
                onClick={handleSave}
                loading={loading}
                size="large"
                style={{ background: '#1890ff' }}
              >
                Save
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={getInitialValues()}
        key={settingsType}
      >
        {/* General Settings */}
        {settingsType === 'general' && (
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Form.Item name="dataRefreshRate" label="Data Refresh Rate">
                      <Select size="large">
                        <Option value={1}>Every 1 minute</Option>
                        <Option value={5}>Every 5 minutes</Option>
                        <Option value={15}>Every 15 minutes</Option>
                        <Option value={30}>Every 30 minutes</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="temperatureUnit" label="Temperature Unit">
                      <Select size="large">
                        <Option value="celsius">Celsius (°C)</Option>
                        <Option value="fahrenheit">Fahrenheit (°F)</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="theme" label="Theme">
                      <Select size="large">
                        <Option value="light">Light</Option>
                        <Option value="dark">Dark</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="language" label="Language">
                      <Select size="large">
                        <Option value="english">English</Option>
                        <Option value="spanish">Spanish</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="dateFormat" label="Date Format">
                      <Select size="large">
                        <Option value="MM/DD/YYYY">MM/DD/YYYY</Option>
                        <Option value="DD/MM/YYYY">DD/MM/YYYY</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        )}

        {/* Power Settings */}
        {settingsType === 'power' && (
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card>
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Form.Item name="powerWarning" label="Power Warning Threshold">
                      <InputNumber addonAfter="%" min={0} max={100} style={{ width: '100%' }} size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="powerCritical" label="Power Critical Threshold">
                      <InputNumber addonAfter="%" min={0} max={100} style={{ width: '100%' }} size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <div style={{ marginTop: 30 }}>
                      <Tag color="blue">Recommended: 80% / 90%</Tag>
                    </div>
                  </Col>
                </Row>

                <Divider>Equipment Monitoring</Divider>

                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Form.Item name="upsMonitoring" label="UPS" valuePropName="checked">
                      <Switch size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="pduMonitoring" label="PDU" valuePropName="checked">
                      <Switch size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="generatorMonitoring" label="Generator" valuePropName="checked">
                      <Switch size="large" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        )}

        {/* Cooling Settings */}
        {settingsType === 'cooling' && (
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Form.Item name="tempWarning" label="Temperature Warning">
                      <InputNumber addonAfter="°F" min={60} max={100} style={{ width: '100%' }} size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="tempCritical" label="Temperature Critical">
                      <InputNumber addonAfter="°F" min={60} max={100} style={{ width: '100%' }} size="large" />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider>Equipment Monitoring</Divider>

                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Form.Item name="cracMonitoring" label="CRAC Units" valuePropName="checked">
                      <Switch size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="crahMonitoring" label="CRAH Units" valuePropName="checked">
                      <Switch size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="chillerMonitoring" label="Chillers" valuePropName="checked">
                      <Switch size="large" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        )}

        {/* Environmental Settings */}
        {settingsType === 'environmental' && (
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card>
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Form.Item name="humidityWarning" label="Humidity Warning">
                      <InputNumber addonAfter="%" min={20} max={80} style={{ width: '100%' }} size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="humidityCritical" label="Humidity Critical">
                      <InputNumber addonAfter="%" min={20} max={80} style={{ width: '100%' }} size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <div style={{ marginTop: 30 }}>
                      <Tag color="blue">Recommended: 45-55%</Tag>
                    </div>
                  </Col>
                </Row>

                <Divider>Sensor Monitoring</Divider>

                <Row gutter={[16, 16]}>
                  <Col span={6}>
                    <Form.Item name="tempSensors" label="Temp Sensors" valuePropName="checked">
                      <Switch size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item name="humiditySensors" label="Humidity Sensors" valuePropName="checked">
                      <Switch size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item name="waterLeakDetection" label="Water Leak" valuePropName="checked">
                      <Switch size="large" />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item name="smokeDetection" label="Smoke" valuePropName="checked">
                      <Switch size="large" />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        )}

        {/* Common Settings for all types */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Card title={<Space><BellOutlined /> Notification Settings</Space>}>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Form.Item name="emailNotifications" label="Email" valuePropName="checked">
                    <Switch size="large" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="pushNotifications" label="Push" valuePropName="checked">
                    <Switch size="large" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="smsNotifications" label="SMS" valuePropName="checked">
                    <Switch size="large" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          <Col span={12}>
            <Card title={<Space><CloudOutlined /> System Settings</Space>}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Form.Item name="dataRetention" label="Data Retention">
                    <Select size="large">
                      <Option value={30}>30 days</Option>
                      <Option value={90}>90 days</Option>
                      <Option value={180}>6 months</Option>
                      <Option value={365}>1 year</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="autoBackup" label="Auto Backup" valuePropName="checked">
                    <Switch size="large" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* Action Buttons */}
        <Row style={{ marginTop: 24 }}>
          <Col span={24} style={{ textAlign: 'right' }}>
            <Space>
              <Button size="large" danger>Reset</Button>
              <Button size="large" type="primary" onClick={handleSave} loading={loading}>
                Save Changes
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>

    </div>
  );
};

export default Settings;