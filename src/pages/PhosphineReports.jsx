import React, { useEffect, useState } from 'react';
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
} from 'antd';
import {
  CloudOutlined,
  BarChartOutlined,
  ReloadOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;

export default function PhosphineReports() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
  });
  const [totalRecords, setTotalRecords] = useState(0);
  const [deviceMaxValue, setDeviceMaxValue] = useState(0);
  const [deviceMinValue, setDeviceMinValue] = useState(0);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  
  // NEW: Separate loading state for Excel export
  const [exportLoading, setExportLoading] = useState(false);

  // Fetch devices list - Filter for Phosphine devices (deviceType = 1001 or 30001)
  const fetchDevices = async () => {
    try {
      const response = await axios.get(`${CO2API}/api/devices`, {
        params: {
          pageNumber: 1,
          pageSize: 100,
        },
      });

      if (response.data && response.data.data) {
        const phosphineDevices = response.data.data.filter(
          (device) => device.deviceType === 30001
        );
        setDevices(phosphineDevices);
      }
    } catch (err) {
      console.error('Error fetching phosphine devices:', err);
    }
  };

  // Fetch data function for Phosphine
  const fetchData = async (page = 1, pageSize = 10, deviceId = null) => {
    setLoading(true);
    try {
      const params = {
        pageNumber: page,
        pageSize: pageSize,
        deviceType: 30001, // Always filter by phosphine device type
      };

      // Only filter by device if a specific device is selected (not null)
      if (deviceId) {
        const selectedDeviceObj = devices.find((d) => d.id === deviceId);
        if (selectedDeviceObj && selectedDeviceObj.ipAddress) {
          params.ipAddress = selectedDeviceObj.ipAddress;
        }
      }

      const response = await axios.get(
        `${CO2API}/api/device-logs/transactions`,
        {
          params,
        }
      );

      const res = response.data || {};

      setTotalRecords(res.totalRecords || 0);
      setDeviceMaxValue(res.deviceMaxValue || 0);
      setDeviceMinValue(res.deviceMinValue || 0);

      if (res.data && res.data.length > 0) {
        // Filter for phosphine devices (deviceTypeId 30001) from the response
        const phosphineData = res.data.filter(item => 
          item.deviceTypeId === 30001
        );

        const processedData = phosphineData.map((item, idx) => ({
          ...item,
          key: item.id || idx,
        }));

        setData(processedData);

        setPagination((prev) => ({
          ...prev,
          current: page,
          pageSize: pageSize,
          total: res.totalRecords || 0,
        }));
      } else {
        setData([]);
        setPagination((prev) => ({
          ...prev,
          current: 1,
          pageSize: pageSize,
          total: 0,
        }));
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching Phosphine data:', err);
      setError('Could not fetch Phosphine data from the server.');
      setData([]);
      setTotalRecords(0);
      setDeviceMaxValue(0);
      setDeviceMinValue(0);
      setPagination((prev) => ({
        ...prev,
        total: 0,
      }));
    } finally {
      setLoading(false);
    }
  };

  // Handle device change
  const handleDeviceChange = (deviceId) => {
    setSelectedDevice(deviceId);
    fetchData(1, pagination.pageSize, deviceId);
  };

  // Initial fetch
  useEffect(() => {
    const initializeData = async () => {
      await fetchDevices();
      fetchData(pagination.current, pagination.pageSize, null);
    };

    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle table change (pagination, sorting)
  const handleTableChange = (newPagination) => {
    fetchData(newPagination.current, newPagination.pageSize, selectedDevice);
  };

  const handleRefresh = () => {
    fetchData(pagination.current, pagination.pageSize, selectedDevice);
  };

  // UPDATED: Excel download handler with separate loading state for Phosphine (deviceType=30001)
  // ADDED: Validation to prevent download when no data
  const handleExportExcel = async () => {
    // Check if there's any data to export
    if (data.length === 0) {
      message.warning('No data available to export. Please check your filters.');
      return;
    }
    
    // Also check total records (in case data is filtered on the server side)
    if (totalRecords === 0) {
      message.warning('No records found for the selected filters.');
      return;
    }

    try {
      setExportLoading(true); // Only set export loading to true
      
      // Find the selected device object
      const selectedDeviceObj = selectedDevice 
        ? devices.find((d) => d.id === selectedDevice)
        : null;
      
      // Construct the API URL for Phosphine (deviceType=30001)
      let apiUrl = `${CO2API}/api/device-logs/transactions-excel?deviceType=30001`;
      
      // Add ipAddress parameter if a specific device is selected
      if (selectedDeviceObj && selectedDeviceObj.ipAddress) {
        apiUrl += `&ipAddress=${encodeURIComponent(selectedDeviceObj.ipAddress)}`;
      }
      
      // Make the request with blob response type
      const response = await axios.get(apiUrl, {
        responseType: 'blob', // Important: tells axios to handle binary data
        headers: {
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel'
        }
      });
      
      // Create a blob from the response
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Set filename for Phosphine
      const filename = selectedDeviceObj 
        ? `Phosphine_Report_${selectedDeviceObj.name}_${new Date().toISOString().split('T')[0]}.xlsx`
        : `Phosphine_Report_All_Devices_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      link.download = filename;
      
      // Append to body, click, and clean up
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      window.URL.revokeObjectURL(downloadUrl);
      
      setExportLoading(false); // Reset export loading when done
      
    } catch (err) {
      console.error('Error exporting Excel:', err);
      setExportLoading(false); // Reset even on error
      
      // Check if it's a 404 or no data error
      if (err.response && err.response.status === 404) {
        message.error('No data found for export. Please check your filters.');
        return;
      }
      
      // Fallback: Try the direct download method
      try {
        // Find the selected device object
        const selectedDeviceObj = selectedDevice 
          ? devices.find((d) => d.id === selectedDevice)
          : null;
        
        // Construct URL for Phosphine (deviceType=30001)
        let downloadUrl = `${CO2API}/api/device-logs/transactions-excel?deviceType=30001`;
        
        if (selectedDeviceObj && selectedDeviceObj.ipAddress) {
          downloadUrl += `&ipAddress=${encodeURIComponent(selectedDeviceObj.ipAddress)}`;
        }
        
        // Add download parameter to force download
        downloadUrl += '&download=true';
        
        window.location.href = downloadUrl;
        setExportLoading(false); // Reset after redirect
      } catch (fallbackErr) {
        console.error('Fallback export also failed:', fallbackErr);
        message.error('Failed to download Excel file. Please try again.');
        setExportLoading(false); // Reset on fallback error
      }
    }
  };

  // Statistics from current page
  const getStatistics = () => {
    if (data.length === 0) {
      return { avgPhosphine: 0, maxPhosphine: 0, minPhosphine: 0 };
    }

    const values = data.map((item) => item.deviceValue || 0);
    const avgPhosphine = (
      values.reduce((sum, value) => sum + value, 0) / values.length
    ).toFixed(3);
    const maxPhosphine = Math.max(...values);
    const minPhosphine = Math.min(...values);

    return { avgPhosphine, maxPhosphine, minPhosphine };
  };

  const { avgPhosphine, maxPhosphine, minPhosphine } = getStatistics();

  // Custom Phosphine color render with Phosphine-specific thresholds
  const renderPhosphine = (value) => {
    let color = '#52c41a'; // green - Safe
    let label = 'Safe';

    // Phosphine thresholds (adjust based on your requirements)
    if (value > 0.1 && value <= 0.3) {
      color = '#faad14'; // orange - Moderate
      label = 'Moderate';
    } else if (value > 0.3) {
      color = '#f5222d'; // red - High
      label = 'High';
    }

    return (
      <Tag
        color={color}
        style={{ fontWeight: 600, minWidth: '80px', textAlign: 'center' }}
      >
        {Number(value).toFixed(3)} ppm
        <br />
        <small>{label}</small>
      </Tag>
    );
  };

  const formatTableDate = (dateString) => {
    const date = new Date(dateString);

    const datePart = date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const timePart = date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return (
      <div style={{ lineHeight: '1.2' }}>
        <div style={{ fontWeight: 500 }}>
          {datePart} {timePart}
        </div>
      </div>
    );
  };

  const columns = [
    {
      title: 'Device Name',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (text) => <Tag color="purple">{text}</Tag>,
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Godown',
      dataIndex: 'areaShad',
      key: 'areaShad',
      width: 120,
      render: (text) => <Tag color="geekblue">{text}</Tag>,
    },
    {
      title: 'Compartment',
      dataIndex: 'areaColumn',
      key: 'areaColumn',
      width: 120,
      render: (text) => <Tag color="cyan">{text}</Tag>,
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 120,
      render: (text) => (
        <Tag color="blue" style={{ fontFamily: 'monospace' }}>
          {text}
        </Tag>
      ),
    },
    {
      title: 'Device Value',
      dataIndex: 'deviceValue',
      key: 'deviceValue',
      width: 150,
      render: renderPhosphine,
      sorter: (a, b) => a.deviceValue - b.deviceValue,
    },
    {
      title: 'Record Time',
      dataIndex: 'regDate',
      key: 'regDate',
      width: 200,
      render: formatTableDate,
      sorter: (a, b) => new Date(a.regDate) - new Date(b.regDate),
      defaultSortOrder: 'descend',
    },
  ];

  if (loading && data.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '80vh',
        }}
      >
        <Spin size="large" tip="Loading Phosphine reports..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ display: 'flex', alignItems: 'center', margin: 0 }}>
              <BarChartOutlined style={{ marginRight: 12, color: '#8b5cf6' }} />
              Phosphine Reports
            </Title>
            <Text type="secondary">Monitoring Phosphine gas levels from sensor devices</Text>
          </Col>
          <Col>
            <Space>
              <Select
                value={selectedDevice}
                onChange={handleDeviceChange}
                style={{ width: 180 }}
                placeholder="Select Device"
                loading={loading}
                allowClear
              >
                <Option value={null}>All Devices</Option>
                {devices.map((device) => (
                  <Option key={device.id} value={device.id}>
                    {device.name}
                  </Option>
                ))}
              </Select>

              {/* UPDATED: Excel Export Button for Phosphine */}
              <Button
                type="default"
                icon={<FileExcelOutlined />}
                onClick={handleExportExcel}
                loading={exportLoading} // Use exportLoading instead of loading
                style={{
                  borderColor: '#10b981',
                  color: '#10b981',
                }}
                disabled={data.length === 0 || totalRecords === 0} // Disable if no data
              >
                Export Excel
              </Button>

              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={loading}
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          style={{ marginBottom: 20 }}
          showIcon
          action={
            <Button size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        />
      )}

      {/* Root-level stats from API for selected filter */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8} md={8}>
          <Card hoverable style={{ borderTop: '3px solid #8b5cf6' }}>
            <Statistic
              title={
                <Space>
                  <CloudOutlined /> Total Records
                </Space>
              }
              value={totalRecords}
              valueStyle={{ color: '#8b5cf6' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={8} md={8}>
          <Card hoverable style={{ borderTop: '3px solid #faad14' }}>
            <Statistic
              title={
                <Space>
                  <ArrowUpOutlined style={{ color: '#faad14' }} />
                  Max Phosphine
                </Space>
              }
              value={deviceMaxValue}
              suffix="ppm"
              valueStyle={{ color: '#faad14', fontWeight: 'bold' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={8} md={8}>
          <Card hoverable style={{ borderTop: '3px solid #722ed1' }}>
            <Statistic
              title={
                <Space>
                  <ArrowDownOutlined style={{ color: '#722ed1' }} />
                  Min Phosphine
                </Space>
              }
              value={deviceMinValue}
              suffix="ppm"
              valueStyle={{ color: '#722ed1', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Phosphine Sensor Readings"
        extra={
          <Space>
            <Text type="secondary">
              Page {pagination.current} of{' '}
              {pagination.pageSize
                ? Math.ceil(pagination.total / pagination.pageSize)
                : 1}
            </Text>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          bordered
          pagination={{
            ...pagination,
            showTotal: (total, range) =>
              `Showing ${range[0]}-${range[1]} of ${total} records (${totalRecords} total)`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 'max-content' }}
          size="middle"
          locale={{
            emptyText:
              data.length === 0 ? (
                <Alert
                  type="info"
                  message="No data available"
                  description="There are no Phosphine sensor readings available for the selected device/filter."
                  showIcon
                />
              ) : (
                'No Phosphine sensor data found'
              ),
          }}
        />
      </Card>

    
    </div>
  );
}


