// RulesEngine.jsx
import React, { useState, useEffect } from "react";
import {
  Table, Alert, Row, Col, Typography, Space,
  Button, Select, message, Input, Tooltip, Badge, Tag,
  Tabs, Switch, Card, Form, Checkbox, DatePicker, InputNumber,
  Modal, Divider, Collapse, Progress, TimePicker
} from "antd";
import {
  EditOutlined, DeleteOutlined, ReloadOutlined,
  CheckCircleOutlined, CloseCircleOutlined, PlusOutlined,
  SearchOutlined, ExclamationCircleOutlined, CloseOutlined,
  SettingOutlined, MailOutlined, BellOutlined, 
  RocketOutlined, AlertOutlined, SafetyOutlined,
  ThunderboltOutlined, ClockCircleOutlined, CalendarOutlined,
  FilePdfOutlined, FileExcelOutlined, DownloadOutlined,
  ScheduleOutlined, TeamOutlined, PieChartOutlined
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Panel } = Collapse;

// ── Constants ──
const SEVERITY_LEVELS = [
  { id: 'critical', label: 'Critical', color: '#ff4d4f', bg: '#fff1f0', icon: '🔴' },
  { id: 'high', label: 'High', color: '#fa8c16', bg: '#fff7e6', icon: '🟠' },
  { id: 'medium', label: 'Medium', color: '#fadb14', bg: '#feffe6', icon: '🟡' },
  { id: 'low', label: 'Low', color: '#1890ff', bg: '#e6f7ff', icon: '🔵' },
  { id: 'info', label: 'Info', color: '#52c41a', bg: '#f6ffed', icon: '🟢' },
];

const PRIORITY_LEVELS = [
  { id: 'p1', label: 'P1 - Critical', color: '#ff4d4f' },
  { id: 'p2', label: 'P2 - High', color: '#fa8c16' },
  { id: 'p3', label: 'P3 - Medium', color: '#fadb14' },
  { id: 'p4', label: 'P4 - Low', color: '#1890ff' },
];

const DEVICE_TYPES = [
  'All Devices', 'UPS', 'PDU', 'CRAC', 'Server', 'Switch',
  'Router', 'Firewall', 'Storage', 'Generator', 'Battery Bank',
  'Chiller', 'Cooling Tower', 'HVAC', 'Sensor', 'Gateway'
];

const METRICS = [
  'temperature', 'humidity', 'power', 'voltage', 'current',
  'uptime', 'cpu', 'memory', 'network', 'fan_speed', 'battery',
  'pressure', 'flow_rate', 'vibration'
];

const OPERATORS = [
  { value: '>', label: '> Greater Than' },
  { value: '>=', label: '>= Greater or Equal' },
  { value: '<', label: '< Less Than' },
  { value: '<=', label: '<= Less or Equal' },
  { value: '=', label: '= Equal To' },
  { value: '!=', label: '≠ Not Equal' },
  { value: 'contains', label: 'Contains' },
  { value: 'starts_with', label: 'Starts With' },
];

const ESCALATION_ACTIONS = [
  'Email Alert', 'SMS Alert', 'Slack/Teams Notification',
  'Ticket Creation', 'Auto-Remediation', 'Page Engineer',
  'Execute Script', 'SNMP Trap'
];

const EMAIL_TEMPLATES = [
  'Default - Critical Alert',
  'Default - Warning Alert',
  'Custom - Infrastructure Team',
  'Custom - Security Team',
  'Custom - Operations Team',
  'Executive Summary',
];

const TIME_WINDOWS = [
  { value: '24x7', label: '24x7 - Always Active' },
  { value: 'business_hours', label: 'Business Hours (9am-6pm)' },
  { value: 'after_hours', label: 'After Hours (6pm-9am)' },
  { value: 'weekend', label: 'Weekend Only' },
  { value: 'custom', label: 'Custom Schedule' },
];

const AUTO_ACTIONS = [
  { value: 'restart_service', label: 'Restart Service' },
  { value: 'reboot_device', label: 'Reboot Device' },
  { value: 'scale_resource', label: 'Scale Resource' },
  { value: 'execute_script', label: 'Execute Script' },
  { value: 'send_command', label: 'Send Command' },
];

// ── Scheduled Report Constants ──
const REPORT_TYPES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'custom', label: 'Custom' },
];

const REPORT_FORMATS = [
  { value: 'pdf', label: 'PDF', icon: <FilePdfOutlined style={{ color: '#ff4d4f' }} /> },
  { value: 'excel', label: 'Excel', icon: <FileExcelOutlined style={{ color: '#52c41a' }} /> },
  { value: 'csv', label: 'CSV', icon: <FileExcelOutlined style={{ color: '#1890ff' }} /> },
];

const REPORT_KPIS = [
  { value: 'power_usage', label: '⚡ Power Usage' },
  { value: 'temperature', label: '🌡 Temperature' },
  { value: 'humidity', label: '💧 Humidity' },
  { value: 'pue', label: '📊 PUE' },
  { value: 'capacity', label: '💾 Capacity' },
  { value: 'uptime', label: '✅ Uptime' },
  { value: 'alerts', label: '🚨 Alert Summary' },
  { value: 'energy_cost', label: '💰 Energy Cost' },
  { value: 'cooling_efficiency', label: '❄️ Cooling Efficiency' },
  { value: 'network_usage', label: '🌐 Network Usage' },
  { value: 'storage_usage', label: '💽 Storage Usage' },
];

// ── Rules Engine Component ──
const RulesEngine = () => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);
  const [editingRule, setEditingRule] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('rules');
  const [sortedInfo, setSortedInfo] = useState({ columnKey: 'severity', order: 'descend' });

  const [searchText, setSearchText] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // ── Scheduled Reports State ──
  const [showReportModal, setShowReportModal] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [reportSearchText, setReportSearchText] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState('all');

  const [rules, setRules] = useState([
    {
      id: 1,
      name: 'UPS Overheat Alert',
      description: 'Trigger when UPS temperature exceeds safe threshold of 35°C for more than 3 minutes',
      enabled: true,
      severity: 'critical',
      priority: 'p1',
      deviceType: 'UPS',
      deviceFilter: 'UPS-*',
      condition: { metric: 'temperature', operator: '>', value: 35, unit: '°C', duration: 3 },
      escalation: {
        level: 1,
        actions: ['Email Alert', 'Page Engineer'],
        emailRecipients: ['admin@datacenter.com', 'noc@datacenter.com'],
        emailTemplate: 'Default - Critical Alert',
        delayMinutes: 0,
        maxEscalations: 3,
        escalateAfter: 5,
        notificationChannels: { email: true, sms: true, slack: false, ticket: true }
      },
      autoRemediation: { enabled: false, action: 'restart_service', scriptPath: '' },
      schedule: { startDate: '2026-01-01', endDate: '', timeWindow: '24x7' },
      createdDate: '2026-01-15',
      lastTriggered: '2026-07-13 14:23:45',
      triggerCount: 47
    },
    {
      id: 2,
      name: 'CRAC High Humidity Alert',
      description: 'Alert when humidity exceeds 60% in any CRAC unit for 5 minutes',
      enabled: true,
      severity: 'high',
      priority: 'p2',
      deviceType: 'CRAC',
      deviceFilter: '',
      condition: { metric: 'humidity', operator: '>', value: 60, unit: '%', duration: 5 },
      escalation: {
        level: 2,
        actions: ['Email Alert', 'Slack/Teams Notification'],
        emailRecipients: ['facility@datacenter.com'],
        emailTemplate: 'Default - Warning Alert',
        delayMinutes: 2,
        maxEscalations: 2,
        escalateAfter: 10,
        notificationChannels: { email: true, sms: false, slack: true, ticket: false }
      },
      autoRemediation: { enabled: true, action: 'execute_script', scriptPath: '/scripts/reduce_humidity.sh' },
      schedule: { startDate: '2026-01-01', endDate: '', timeWindow: '24x7' },
      createdDate: '2026-02-20',
      lastTriggered: '2026-07-12 09:15:22',
      triggerCount: 128
    },
    {
      id: 3,
      name: 'PDU Overload Warning',
      description: 'PDU load exceeds safe operating capacity of 80% for more than 2 minutes',
      enabled: false,
      severity: 'medium',
      priority: 'p3',
      deviceType: 'PDU',
      deviceFilter: 'PDU-0*',
      condition: { metric: 'power', operator: '>', value: 80, unit: '%', duration: 2 },
      escalation: {
        level: 1,
        actions: ['Email Alert', 'Ticket Creation'],
        emailRecipients: ['ops@datacenter.com'],
        emailTemplate: 'Custom - Operations Team',
        delayMinutes: 0,
        maxEscalations: 1,
        escalateAfter: 3,
        notificationChannels: { email: true, sms: false, slack: false, ticket: true }
      },
      autoRemediation: { enabled: false, action: 'restart_service', scriptPath: '' },
      schedule: { startDate: '2026-01-01', endDate: '', timeWindow: 'business_hours' },
      createdDate: '2026-03-10',
      lastTriggered: '2026-07-10 16:45:33',
      triggerCount: 23
    },
    {
      id: 4,
      name: 'Server High CPU Usage',
      description: 'Alert when CPU usage exceeds 90% for 5 minutes',
      enabled: true,
      severity: 'high',
      priority: 'p2',
      deviceType: 'Server',
      deviceFilter: 'SRV-*',
      condition: { metric: 'cpu', operator: '>', value: 90, unit: '%', duration: 5 },
      escalation: {
        level: 2,
        actions: ['Email Alert', 'Auto-Remediation', 'Slack/Teams Notification'],
        emailRecipients: ['devops@datacenter.com', 'engineers@datacenter.com'],
        emailTemplate: 'Custom - Infrastructure Team',
        delayMinutes: 1,
        maxEscalations: 3,
        escalateAfter: 7,
        notificationChannels: { email: true, sms: false, slack: true, ticket: true }
      },
      autoRemediation: { enabled: true, action: 'scale_resource', scriptPath: '' },
      schedule: { startDate: '2026-01-01', endDate: '', timeWindow: '24x7' },
      createdDate: '2026-04-05',
      lastTriggered: '2026-07-13 13:58:11',
      triggerCount: 312
    },
    {
      id: 5,
      name: 'Battery Bank Low Capacity',
      description: 'Alert when battery bank capacity drops below 30%',
      enabled: true,
      severity: 'critical',
      priority: 'p1',
      deviceType: 'Battery Bank',
      deviceFilter: 'BB-*',
      condition: { metric: 'battery', operator: '<', value: 30, unit: '%', duration: 2 },
      escalation: {
        level: 1,
        actions: ['Email Alert', 'SMS Alert', 'Page Engineer'],
        emailRecipients: ['facility@datacenter.com', 'admin@datacenter.com'],
        emailTemplate: 'Default - Critical Alert',
        delayMinutes: 0,
        maxEscalations: 4,
        escalateAfter: 3,
        notificationChannels: { email: true, sms: true, slack: true, ticket: true }
      },
      autoRemediation: { enabled: false, action: '', scriptPath: '' },
      schedule: { startDate: '2026-01-01', endDate: '', timeWindow: '24x7' },
      createdDate: '2026-05-12',
      lastTriggered: '2026-07-13 08:02:44',
      triggerCount: 19
    },
  ]);

  // ── Scheduled Reports Data ──
  const [reports, setReports] = useState([
    {
      id: 1,
      name: 'Daily Power Usage Report',
      description: 'Daily summary of power consumption across all data center zones',
      enabled: true,
      reportType: 'daily',
      reportFormat: 'pdf',
      scheduleTime: '08:00',
      recipients: ['admin@datacenter.com', 'ops@datacenter.com', 'facility@datacenter.com'],
      kpis: ['power_usage', 'pue', 'energy_cost'],
      deviceFilter: 'All Devices',
      includeCharts: true,
      includeSummary: true,
      lastSent: '2026-07-13 08:00:00',
      nextRun: '2026-07-14 08:00:00',
      createdDate: '2026-01-10',
    },
    {
      id: 2,
      name: 'Weekly Infrastructure Health Report',
      description: 'Weekly health overview including temperature, humidity, and uptime metrics',
      enabled: true,
      reportType: 'weekly',
      reportFormat: 'pdf',
      scheduleTime: '09:30',
      recipients: ['admin@datacenter.com', 'engineers@datacenter.com', 'management@datacenter.com'],
      kpis: ['temperature', 'humidity', 'uptime', 'alerts'],
      deviceFilter: 'All Devices',
      includeCharts: true,
      includeSummary: true,
      lastSent: '2026-07-12 09:30:00',
      nextRun: '2026-07-19 09:30:00',
      createdDate: '2026-01-15',
    },
    {
      id: 3,
      name: 'Monthly Capacity & Cost Report',
      description: 'Monthly analysis of capacity utilization and associated costs',
      enabled: true,
      reportType: 'monthly',
      reportFormat: 'excel',
      scheduleTime: '07:00',
      recipients: ['finance@datacenter.com', 'management@datacenter.com'],
      kpis: ['capacity', 'storage_usage', 'energy_cost', 'cooling_efficiency'],
      deviceFilter: 'All Devices',
      includeCharts: true,
      includeSummary: false,
      lastSent: '2026-07-01 07:00:00',
      nextRun: '2026-08-01 07:00:00',
      createdDate: '2026-01-20',
    },
    {
      id: 4,
      name: 'Critical Alerts Summary',
      description: 'Summary of all critical alerts triggered in the last 24 hours',
      enabled: false,
      reportType: 'daily',
      reportFormat: 'csv',
      scheduleTime: '23:00',
      recipients: ['noc@datacenter.com', 'security@datacenter.com'],
      kpis: ['alerts'],
      deviceFilter: 'All Devices',
      includeCharts: false,
      includeSummary: true,
      lastSent: '2026-07-12 23:00:00',
      nextRun: '2026-07-13 23:00:00',
      createdDate: '2026-02-05',
    },
  ]);

  const emptyForm = {
    name: '',
    description: '',
    enabled: true,
    severity: 'critical',
    priority: 'p1',
    deviceType: 'All Devices',
    deviceFilter: '',
    condition: { metric: 'temperature', operator: '>', value: 25, unit: '°C', duration: 5 },
    escalation: {
      level: 1,
      actions: ['Email Alert'],
      emailRecipients: [],
      emailTemplate: 'Default - Critical Alert',
      delayMinutes: 0,
      maxEscalations: 3,
      escalateAfter: 5,
      notificationChannels: { email: true, sms: false, slack: false, ticket: false }
    },
    autoRemediation: { enabled: false, action: 'restart_service', scriptPath: '' },
    schedule: { startDate: new Date().toISOString().split('T')[0], endDate: '', timeWindow: '24x7' },
  };

  // ── Empty Report Form ──
  const emptyReportForm = {
    name: '',
    description: '',
    enabled: true,
    reportType: 'daily',
    reportFormat: 'pdf',
    scheduleTime: '08:00',
    recipients: [],
    kpis: ['power_usage'],
    deviceFilter: 'All Devices',
    includeCharts: true,
    includeSummary: true,
  };

  const [formData, setFormData] = useState(emptyForm);
  const [formActiveTab, setFormActiveTab] = useState('basic');
  const [reportFormData, setReportFormData] = useState(emptyReportForm);
  const [reportFormActiveTab, setReportFormActiveTab] = useState('basic');

  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(null), 5000); return () => clearTimeout(t); }
  }, [error]);

  // ── Rule Handlers ──
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleConditionChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      condition: { ...prev.condition, [field]: value }
    }));
  };

  const handleEscalationChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      escalation: { ...prev.escalation, [field]: value }
    }));
  };

  const handleNotificationChange = (channel, checked) => {
    setFormData(prev => ({
      ...prev,
      escalation: {
        ...prev.escalation,
        notificationChannels: {
          ...prev.escalation.notificationChannels,
          [channel]: checked
        }
      }
    }));
  };

  const handleScheduleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      schedule: { ...prev.schedule, [field]: value }
    }));
  };

  const handleAutoRemediationChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      autoRemediation: { ...prev.autoRemediation, [field]: value }
    }));
  };

  // ── Report Handlers ──
  const handleReportInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setReportFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleReportSelectChange = (name, value) => {
    setReportFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleReportKpiToggle = (kpi) => {
    setReportFormData(prev => ({
      ...prev,
      kpis: prev.kpis.includes(kpi)
        ? prev.kpis.filter(k => k !== kpi)
        : [...prev.kpis, kpi]
    }));
  };

  const handleReportRecipientAdd = (email) => {
    if (email && !reportFormData.recipients.includes(email)) {
      setReportFormData(prev => ({
        ...prev,
        recipients: [...prev.recipients, email]
      }));
    }
  };

  const handleReportRecipientRemove = (email) => {
    setReportFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== email)
    }));
  };

  // ── Report CRUD ──
  const openAddReportModal = () => {
    setEditingReport(null);
    setReportFormData(emptyReportForm);
    setReportFormActiveTab('basic');
    setShowReportModal(true);
  };

  const openEditReportModal = (report) => {
    setEditingReport(report);
    setReportFormData({
      name: report.name,
      description: report.description || '',
      enabled: report.enabled,
      reportType: report.reportType,
      reportFormat: report.reportFormat,
      scheduleTime: report.scheduleTime,
      recipients: [...report.recipients],
      kpis: [...report.kpis],
      deviceFilter: report.deviceFilter || 'All Devices',
      includeCharts: report.includeCharts !== undefined ? report.includeCharts : true,
      includeSummary: report.includeSummary !== undefined ? report.includeSummary : true,
    });
    setReportFormActiveTab('basic');
    setShowReportModal(true);
  };

  const openDeleteReportModal = (report) => {
    setRuleToDelete(report);
    setShowDeleteModal(true);
  };

  const handleReportSubmit = () => {
    if (!reportFormData.name || !reportFormData.reportType || !reportFormData.scheduleTime) {
      setError('Please fill all required fields: Name, Report Type, and Schedule Time');
      return;
    }

    if (reportFormData.recipients.length === 0) {
      setError('Please add at least one email recipient');
      return;
    }

    if (reportFormData.kpis.length === 0) {
      setError('Please select at least one KPI to include in the report');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const payload = {
        name: reportFormData.name,
        description: reportFormData.description || '',
        enabled: reportFormData.enabled,
        reportType: reportFormData.reportType,
        reportFormat: reportFormData.reportFormat,
        scheduleTime: reportFormData.scheduleTime,
        recipients: [...reportFormData.recipients],
        kpis: [...reportFormData.kpis],
        deviceFilter: reportFormData.deviceFilter || 'All Devices',
        includeCharts: reportFormData.includeCharts,
        includeSummary: reportFormData.includeSummary,
      };

      if (editingReport) {
        setReports(reports.map(r => r.id === editingReport.id ? { ...r, ...payload } : r));
        message.success('Report updated successfully!');
      } else {
        setReports([...reports, {
          id: reports.length + 1,
          ...payload,
          lastSent: 'Never',
          nextRun: new Date().toISOString().replace('T', ' ').slice(0, 19),
          createdDate: new Date().toISOString().split('T')[0],
        }]);
        message.success('Report created successfully!');
      }
      setLoading(false);
      setShowReportModal(false);
    }, 500);
  };

  const handleReportToggle = (reportId) => {
    setReports(reports.map(report =>
      report.id === reportId
        ? { ...report, enabled: !report.enabled }
        : report
    ));
    const report = reports.find(r => r.id === reportId);
    message.success(`Report ${report.enabled ? 'disabled' : 'enabled'} successfully!`);
  };

  const handleReportDelete = () => {
    if (ruleToDelete) {
      setReports(reports.filter(r => r.id !== ruleToDelete.id));
      message.success('Report deleted successfully!');
      closeDeleteModal();
    }
  };

  const handleSendReportNow = (reportId) => {
    const report = reports.find(r => r.id === reportId);
    message.loading({ content: `Sending "${report.name}"...`, key: 'sending' });
    setTimeout(() => {
      message.success({ content: `✅ "${report.name}" sent successfully to ${report.recipients.length} recipients!`, key: 'sending' });
    }, 1500);
  };

  // ── Rule CRUD ──
  const openAddModal = () => {
    setEditingRule(null);
    setFormData(emptyForm);
    setFormActiveTab('basic');
    setShowModal(true);
  };

  const openEditModal = (rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      enabled: rule.enabled,
      severity: rule.severity,
      priority: rule.priority,
      deviceType: rule.deviceType,
      deviceFilter: rule.deviceFilter || '',
      condition: { ...rule.condition },
      escalation: {
        ...rule.escalation,
        notificationChannels: rule.escalation.notificationChannels || { email: true, sms: false, slack: false, ticket: false }
      },
      autoRemediation: { ...rule.autoRemediation },
      schedule: { ...rule.schedule },
    });
    setFormActiveTab('basic');
    setShowModal(true);
  };

  const openDeleteModal = (rule) => {
    setRuleToDelete(rule);
    setShowDeleteModal(true);
  };

  const closeModal = () => setShowModal(false);
  const closeDeleteModal = () => { setShowDeleteModal(false); setRuleToDelete(null); };

  const handleDelete = () => {
    if (ruleToDelete) {
      setRules(rules.filter(r => r.id !== ruleToDelete.id));
      message.success('Rule deleted successfully!');
      closeDeleteModal();
    }
  };

  const handleToggleRule = (ruleId) => {
    setRules(rules.map(rule =>
      rule.id === ruleId
        ? { ...rule, enabled: !rule.enabled }
        : rule
    ));
    const rule = rules.find(r => r.id === ruleId);
    message.success(`Rule ${rule.enabled ? 'disabled' : 'enabled'} successfully!`);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.severity || !formData.priority) {
      setError('Please fill all required fields: Name, Severity, and Priority');
      return;
    }

    if (!formData.condition.metric || !formData.condition.value) {
      setError('Please configure the condition with metric and value');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const payload = {
        name: formData.name,
        description: formData.description || '',
        enabled: formData.enabled,
        severity: formData.severity,
        priority: formData.priority,
        deviceType: formData.deviceType,
        deviceFilter: formData.deviceFilter || '',
        condition: { ...formData.condition },
        escalation: { ...formData.escalation },
        autoRemediation: { ...formData.autoRemediation },
        schedule: { ...formData.schedule },
      };

      if (editingRule) {
        setRules(rules.map(r => r.id === editingRule.id ? { ...r, ...payload } : r));
        message.success('Rule updated successfully!');
      } else {
        setRules([...rules, {
          id: rules.length + 1,
          ...payload,
          createdDate: new Date().toISOString().split('T')[0],
          lastTriggered: 'Never',
          triggerCount: 0,
        }]);
        message.success('Rule created successfully!');
      }
      setLoading(false);
      closeModal();
    }, 500);
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setSortedInfo(sorter);
  };

  // ── Filtered Data ──
  const filteredRules = rules.filter(rule => {
    const s = searchText.toLowerCase();
    const matchSearch = !s
      || rule.name.toLowerCase().includes(s)
      || rule.description.toLowerCase().includes(s)
      || rule.deviceType.toLowerCase().includes(s)
      || rule.condition.metric.toLowerCase().includes(s);
    const matchSeverity = severityFilter === 'all' || rule.severity === severityFilter;
    const matchStatus = statusFilter === 'all'
      || (statusFilter === 'active' && rule.enabled)
      || (statusFilter === 'inactive' && !rule.enabled);
    return matchSearch && matchSeverity && matchStatus;
  });

  const filteredReports = reports.filter(report => {
    const s = reportSearchText.toLowerCase();
    const matchSearch = !s
      || report.name.toLowerCase().includes(s)
      || report.description.toLowerCase().includes(s)
      || report.reportType.toLowerCase().includes(s);
    const matchStatus = reportStatusFilter === 'all'
      || (reportStatusFilter === 'active' && report.enabled)
      || (reportStatusFilter === 'inactive' && !report.enabled);
    return matchSearch && matchStatus;
  });

  // ── Stats ──
  const totalRules = rules.length;
  const activeRules = rules.filter(r => r.enabled).length;
  const criticalRules = rules.filter(r => r.severity === 'critical' && r.enabled).length;
  const highRules = rules.filter(r => r.severity === 'high' && r.enabled).length;

  const totalReports = reports.length;
  const activeReports = reports.filter(r => r.enabled).length;

  // ── Helpers ──
  const getSeverityConfig = (severity) => {
    return SEVERITY_LEVELS.find(s => s.id === severity) || SEVERITY_LEVELS[0];
  };

  const getPriorityColor = (priority) => {
    const p = PRIORITY_LEVELS.find(p => p.id === priority);
    return p ? p.color : '#1890ff';
  };

  const getReportTypeLabel = (type) => {
    const found = REPORT_TYPES.find(t => t.value === type);
    return found ? found.label : type;
  };

  const getReportFormatLabel = (format) => {
    const found = REPORT_FORMATS.find(f => f.value === format);
    return found ? found.label : format;
  };

  const getKpiLabel = (kpi) => {
    const found = REPORT_KPIS.find(k => k.value === kpi);
    return found ? found.label : kpi;
  };

  // ── Styles ──
  const backdropStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000
  };

  const lbl = { display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 };
  const inputStyle = {
    width: '100%', padding: '6px 10px', border: '1px solid #d9d9d9',
    borderRadius: 6, fontSize: 13, boxSizing: 'border-box',
    outline: 'none', fontFamily: 'inherit'
  };

  // ── Report Columns ──
  const reportColumns = [
    {
      title: 'ID', dataIndex: 'id', key: 'id', width: 55,
      render: t => <Text style={{ fontSize: 11 }}>#{t}</Text>,
    },
    {
      title: 'Report Name', dataIndex: 'name', key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ScheduleOutlined style={{ color: '#1890ff' }} />
            <Text strong style={{ fontSize: 12 }}>{text}</Text>
            <Tag color={record.enabled ? 'green' : 'default'} style={{ fontSize: 9, margin: 0 }}>
              {record.enabled ? 'Active' : 'Disabled'}
            </Tag>
          </div>
          <Text type="secondary" style={{ fontSize: 10 }}>
            {getReportTypeLabel(record.reportType)} · {getReportFormatLabel(record.reportFormat)}
          </Text>
        </div>
      ),
    },
    {
      title: 'Schedule', key: 'schedule', width: 140,
      render: (_, record) => (
        <div>
          <div><ClockCircleOutlined style={{ marginRight: 4 }} /> {record.scheduleTime}</div>
          <div style={{ fontSize: 10, color: '#888' }}>
            Next: {record.nextRun || 'Not scheduled'}
          </div>
        </div>
      ),
    },
    {
      title: 'KPIs', key: 'kpis', width: 180,
      render: (_, record) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {record.kpis.slice(0, 4).map(k => (
            <Tag key={k} size="small" style={{ fontSize: 8, margin: 0 }}>
              {getKpiLabel(k).split(' ').slice(0, 2).join(' ')}
            </Tag>
          ))}
          {record.kpis.length > 4 && (
            <Tag size="small" style={{ fontSize: 8 }}>+{record.kpis.length - 4}</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Recipients', key: 'recipients', width: 120,
      render: (_, record) => (
        <div>
          <Badge count={record.recipients.length} style={{ backgroundColor: '#1890ff' }} />
          <div style={{ fontSize: 9, color: '#888' }}>
            {record.recipients.slice(0, 2).join(', ')}
            {record.recipients.length > 2 && ` +${record.recipients.length - 2}`}
          </div>
        </div>
      ),
    },
    {
      title: 'Last Sent', dataIndex: 'lastSent', key: 'lastSent', width: 120,
      render: (text) => <Text style={{ fontSize: 11 }}>{text}</Text>,
    },
    {
      title: 'Actions', key: 'actions', width: 130, fixed: 'right',
      render: (_, record) => (
        <Space size={2}>
          <Tooltip title="Send Now">
            <Button type="text" size="small" icon={<RocketOutlined />}
              onClick={() => handleSendReportNow(record.id)}
              style={{ color: '#52c41a', padding: '0 4px' }} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined />}
              onClick={() => openEditReportModal(record)}
              style={{ color: '#1890ff', padding: '0 4px' }} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button type="text" size="small" icon={<DeleteOutlined />}
              onClick={() => openDeleteReportModal(record)}
              style={{ color: '#ff4d4f', padding: '0 4px' }} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      backgroundColor: '#f0f2f5', padding: '10px 16px',
      boxSizing: 'border-box', overflow: 'hidden'
    }}>

      {/* ── TABS ── */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 8, flexShrink: 0, borderBottom: '1px solid #d9d9d9' }}>
        <div
          onClick={() => setActiveTab('rules')}
          style={{
            padding: '8px 20px',
            cursor: 'pointer',
            borderBottom: activeTab === 'rules' ? '3px solid #1890ff' : '3px solid transparent',
            color: activeTab === 'rules' ? '#1890ff' : '#666',
            fontWeight: activeTab === 'rules' ? 700 : 500,
            fontSize: 14,
            transition: 'all 0.3s',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <SettingOutlined /> Rules & Escalation
          <Badge count={activeRules} style={{ backgroundColor: '#1890ff', marginLeft: 4 }} />
        </div>
        <div
          onClick={() => setActiveTab('reports')}
          style={{
            padding: '8px 20px',
            cursor: 'pointer',
            borderBottom: activeTab === 'reports' ? '3px solid #1890ff' : '3px solid transparent',
            color: activeTab === 'reports' ? '#1890ff' : '#666',
            fontWeight: activeTab === 'reports' ? 700 : 500,
            fontSize: 14,
            transition: 'all 0.3s',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <MailOutlined /> Scheduled Reports
          <Badge count={activeReports} style={{ backgroundColor: '#52c41a', marginLeft: 4 }} />
        </div>
      </div>

      {/* ── RULES TAB ── */}
      {activeTab === 'rules' && (
        <>
          {/* HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexShrink: 0 }}>
            <div>
              <Title level={4} style={{ margin: 0, lineHeight: 1.3 }}>
                <SettingOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                Rules & Escalation Engine
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>Configure custom alert rules, escalation policies, and auto-remediation</Text>
            </div>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal} size="small"
                style={{ background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', border: 'none' }}>
                Create Rule
              </Button>
              <Button icon={<ReloadOutlined />} size="small" onClick={() => window.location.reload()}>Refresh</Button>
            </Space>
          </div>

          {/* ERROR */}
          {error && (
            <Alert message={error} type="error" showIcon closable onClose={() => setError(null)}
              style={{ marginBottom: 6, padding: '4px 12px', fontSize: 12, flexShrink: 0 }} />
          )}

          {/* STAT CARDS */}
          <Row gutter={10} style={{ marginBottom: 8, flexShrink: 0 }}>
            {[
              { label: 'Total Rules', value: totalRules, color: '#1890ff', icon: <SettingOutlined /> },
              { label: 'Active Rules', value: activeRules, color: '#52c41a', icon: <CheckCircleOutlined /> },
              { label: 'Critical', value: criticalRules, color: '#ff4d4f', icon: <AlertOutlined /> },
              { label: 'High Priority', value: highRules, color: '#fa8c16', icon: <ThunderboltOutlined /> },
            ].map(({ label, value, color, icon }) => (
              <Col key={label} span={6}>
                <div style={{
                  backgroundColor: 'white', borderRadius: 6, padding: '8px 14px',
                  borderTop: `3px solid ${color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  display: 'flex', alignItems: 'center', gap: 10
                }}>
                  <span style={{ fontSize: 22, color }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 11, color: '#888', lineHeight: 1.3 }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>

          {/* FILTERS */}
          <div style={{
            backgroundColor: 'white', borderRadius: 6, padding: '8px 12px',
            marginBottom: 8, flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
          }}>
            <Row gutter={16} align="middle">
              <Col xs={24} sm={24} md={8} lg={8}>
                <Input
                  placeholder="Search rules by name, device, metric..."
                  prefix={<SearchOutlined style={{ color: '#bbb' }} />}
                  value={searchText} onChange={e => setSearchText(e.target.value)}
                  allowClear size="small"
                />
              </Col>
              <Col xs={12} sm={8} md={5} lg={5}>
                <Select value={severityFilter} onChange={setSeverityFilter} size="small" style={{ width: '100%' }}>
                  <Option value="all">All Severities</Option>
                  {SEVERITY_LEVELS.map(s => (
                    <Option key={s.id} value={s.id}>{s.icon} {s.label}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={12} sm={8} md={4} lg={4}>
                <Select value={statusFilter} onChange={setStatusFilter} size="small" style={{ width: '100%' }}>
                  <Option value="all">All Status</Option>
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                </Select>
              </Col>
              <Col xs={0} sm={0} md={7} lg={7} style={{ textAlign: 'right' }}>
                <Text style={{ fontSize: 12, color: '#888' }}>{filteredRules.length} / {totalRules} rules shown</Text>
              </Col>
            </Row>
          </div>

          {/* TABLE */}
          <div style={{
            flex: 1, backgroundColor: 'white', borderRadius: 6,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', minHeight: 0
          }}>
            <div style={{
              padding: '7px 14px', borderBottom: '1px solid #f0f0f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
            }}>
              <Text strong style={{ fontSize: 13 }}>Rules List</Text>
              <Badge count={filteredRules.length} style={{ backgroundColor: '#1890ff' }} />
            </div>
            <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
              <Table
                columns={columns} dataSource={filteredRules} loading={loading}
                bordered={false} rowKey="id" size="small"
                scroll={{ x: 'max-content' }}
                pagination={{
                  pageSize: 8, showSizeChanger: false,
                  showTotal: total => `${total} rules`,
                  size: 'small', style: { padding: '5px 14px', margin: 0 }
                }}
                onChange={handleTableChange} style={{ fontSize: 12 }}
                locale={{ emptyText: <div style={{ padding: '12px 0', textAlign: 'center', color: '#999', fontSize: 13 }}>No rules found</div> }}
              />
            </div>
          </div>
        </>
      )}

      {/* ── REPORTS TAB ── */}
      {activeTab === 'reports' && (
        <>
          {/* HEADER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexShrink: 0 }}>
            <div>
              <Title level={4} style={{ margin: 0, lineHeight: 1.3 }}>
                <MailOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                Scheduled Reports
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>Configure auto-timed email reports on required KPIs to selected audiences</Text>
            </div>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={openAddReportModal} size="small"
                style={{ background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', border: 'none' }}>
                Create Report
              </Button>
              <Button icon={<ReloadOutlined />} size="small" onClick={() => window.location.reload()}>Refresh</Button>
            </Space>
          </div>

          {/* STAT CARDS */}
          <Row gutter={10} style={{ marginBottom: 8, flexShrink: 0 }}>
            {[
              { label: 'Total Reports', value: totalReports, color: '#1890ff', icon: <MailOutlined /> },
              { label: 'Active Reports', value: activeReports, color: '#52c41a', icon: <CheckCircleOutlined /> },
              { label: 'Daily', value: reports.filter(r => r.reportType === 'daily' && r.enabled).length, color: '#fa8c16', icon: <CalendarOutlined /> },
              { label: 'Weekly/Monthly', value: reports.filter(r => (r.reportType === 'weekly' || r.reportType === 'monthly') && r.enabled).length, color: '#722ed1', icon: <ScheduleOutlined /> },
            ].map(({ label, value, color, icon }) => (
              <Col key={label} span={6}>
                <div style={{
                  backgroundColor: 'white', borderRadius: 6, padding: '8px 14px',
                  borderTop: `3px solid ${color}`, boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  display: 'flex', alignItems: 'center', gap: 10
                }}>
                  <span style={{ fontSize: 22, color }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 11, color: '#888', lineHeight: 1.3 }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>

          {/* FILTERS */}
          <div style={{
            backgroundColor: 'white', borderRadius: 6, padding: '8px 12px',
            marginBottom: 8, flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
          }}>
            <Row gutter={16} align="middle">
              <Col xs={24} sm={24} md={10} lg={10}>
                <Input
                  placeholder="Search reports by name, description..."
                  prefix={<SearchOutlined style={{ color: '#bbb' }} />}
                  value={reportSearchText} onChange={e => setReportSearchText(e.target.value)}
                  allowClear size="small"
                />
              </Col>
              <Col xs={12} sm={8} md={5} lg={5}>
                <Select value={reportStatusFilter} onChange={setReportStatusFilter} size="small" style={{ width: '100%' }}>
                  <Option value="all">All Status</Option>
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                </Select>
              </Col>
              <Col xs={0} sm={0} md={9} lg={9} style={{ textAlign: 'right' }}>
                <Text style={{ fontSize: 12, color: '#888' }}>{filteredReports.length} / {totalReports} reports shown</Text>
              </Col>
            </Row>
          </div>

          {/* TABLE */}
          <div style={{
            flex: 1, backgroundColor: 'white', borderRadius: 6,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', minHeight: 0
          }}>
            <div style={{
              padding: '7px 14px', borderBottom: '1px solid #f0f0f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0
            }}>
              <Text strong style={{ fontSize: 13 }}>Report List</Text>
              <Badge count={filteredReports.length} style={{ backgroundColor: '#1890ff' }} />
            </div>
            <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
              <Table
                columns={reportColumns} dataSource={filteredReports} loading={loading}
                bordered={false} rowKey="id" size="small"
                scroll={{ x: 'max-content' }}
                pagination={{
                  pageSize: 8, showSizeChanger: false,
                  showTotal: total => `${total} reports`,
                  size: 'small', style: { padding: '5px 14px', margin: 0 }
                }}
                style={{ fontSize: 12 }}
                locale={{ emptyText: <div style={{ padding: '12px 0', textAlign: 'center', color: '#999', fontSize: 13 }}>No reports found</div> }}
              />
            </div>
          </div>
        </>
      )}


      {/* ════════════════ RULE MODAL ════════════════ */}
      {showModal && (
        <>
          <div style={backdropStyle} onClick={closeModal} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            backgroundColor: 'white', padding: '20px 24px', borderRadius: 10,
            width: '820px', maxWidth: '96%', maxHeight: '92vh', overflowY: 'auto',
            zIndex: 1001, boxShadow: '0 8px 32px rgba(0,0,0,0.18)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'linear-gradient(135deg, #1890ff, #096dd9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <SettingOutlined style={{ color: 'white', fontSize: 15 }} />
                </div>
                <h3 style={{ margin: 0, color: '#1890ff', fontSize: 15 }}>
                  {editingRule ? 'Edit Rule' : 'Create New Rule'}
                </h3>
              </div>
              <Button type="text" icon={<CloseOutlined />} onClick={closeModal} style={{ color: '#666' }} />
            </div>

            <Tabs activeKey={formActiveTab} onChange={setFormActiveTab} size="small">
              <TabPane tab="📋 Basic" key="basic">
                <Row gutter={14} style={{ marginBottom: 12 }}>
                  <Col span={16}>
                    <label style={lbl}>Rule Name <span style={{ color: '#ff4d4f' }}>*</span></label>
                    <input
                      type="text" name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      style={inputStyle}
                      placeholder="e.g., UPS Overheat Alert"
                      onFocus={e => e.target.style.borderColor = '#1890ff'}
                      onBlur={e => e.target.style.borderColor = '#d9d9d9'}
                    />
                  </Col>
                  <Col span={8}>
                    <label style={lbl}>Status</label>
                    <div style={{ paddingTop: 4 }}>
                      <Switch
                        checked={formData.enabled}
                        onChange={(checked) => handleSelectChange('enabled', checked)}
                        checkedChildren="Active"
                        unCheckedChildren="Disabled"
                      />
                    </div>
                  </Col>
                </Row>

                <Row gutter={14} style={{ marginBottom: 12 }}>
                  <Col span={8}>
                    <label style={lbl}>Severity <span style={{ color: '#ff4d4f' }}>*</span></label>
                    <Select
                      value={formData.severity}
                      onChange={v => handleSelectChange('severity', v)}
                      style={{ width: '100%' }} size="small"
                    >
                      {SEVERITY_LEVELS.map(s => (
                        <Option key={s.id} value={s.id}>
                          <Space size={4}>
                            <span>{s.icon}</span>
                            <Tag color={s.color} style={{ margin: 0 }}>{s.label}</Tag>
                          </Space>
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={8}>
                    <label style={lbl}>Priority <span style={{ color: '#ff4d4f' }}>*</span></label>
                    <Select
                      value={formData.priority}
                      onChange={v => handleSelectChange('priority', v)}
                      style={{ width: '100%' }} size="small"
                    >
                      {PRIORITY_LEVELS.map(p => (
                        <Option key={p.id} value={p.id}>
                          <Tag color={p.color} style={{ margin: 0 }}>{p.label}</Tag>
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={8}>
                    <label style={lbl}>Device Type</label>
                    <Select
                      value={formData.deviceType}
                      onChange={v => handleSelectChange('deviceType', v)}
                      style={{ width: '100%' }} size="small"
                      showSearch allowClear
                    >
                      {DEVICE_TYPES.map(d => <Option key={d} value={d}>{d}</Option>)}
                    </Select>
                  </Col>
                </Row>

                <Row gutter={14} style={{ marginBottom: 12 }}>
                  <Col span={24}>
                    <label style={lbl}>Device Filter (optional)</label>
                    <input
                      type="text" name="deviceFilter"
                      value={formData.deviceFilter}
                      onChange={handleInputChange}
                      style={inputStyle}
                      placeholder="e.g., UPS-*, SRV-0*, RACK-01"
                      onFocus={e => e.target.style.borderColor = '#1890ff'}
                      onBlur={e => e.target.style.borderColor = '#d9d9d9'}
                    />
                    <Text type="secondary" style={{ fontSize: 11 }}>Use wildcard * for pattern matching</Text>
                  </Col>
                </Row>

                <div>
                  <label style={lbl}>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
                    placeholder="Enter a brief description of this rule..."
                    onFocus={e => e.target.style.borderColor = '#1890ff'}
                    onBlur={e => e.target.style.borderColor = '#d9d9d9'}
                  />
                </div>
              </TabPane>

              <TabPane tab="🎯 Conditions" key="conditions">
                <div style={{ background: '#f6ffed', padding: '12px 16px', borderRadius: 6, border: '1px solid #b7eb8f', marginBottom: 12 }}>
                  <Text strong style={{ color: '#52c41a' }}>🎯 Trigger Conditions</Text>
                </div>

                <Row gutter={14} style={{ marginBottom: 12 }}>
                  <Col span={6}>
                    <label style={lbl}>Metric <span style={{ color: '#ff4d4f' }}>*</span></label>
                    <Select
                      value={formData.condition.metric}
                      onChange={v => handleConditionChange('metric', v)}
                      style={{ width: '100%' }} size="small"
                    >
                      {METRICS.map(m => <Option key={m} value={m}>{m.replace('_', ' ').toUpperCase()}</Option>)}
                    </Select>
                  </Col>
                  <Col span={6}>
                    <label style={lbl}>Operator <span style={{ color: '#ff4d4f' }}>*</span></label>
                    <Select
                      value={formData.condition.operator}
                      onChange={v => handleConditionChange('operator', v)}
                      style={{ width: '100%' }} size="small"
                    >
                      {OPERATORS.map(o => <Option key={o.value} value={o.value}>{o.label}</Option>)}
                    </Select>
                  </Col>
                  <Col span={6}>
                    <label style={lbl}>Value <span style={{ color: '#ff4d4f' }}>*</span></label>
                    <InputNumber
                      value={formData.condition.value}
                      onChange={v => handleConditionChange('value', v)}
                      style={{ width: '100%' }} size="small"
                      min={0}
                      step={0.1}
                    />
                  </Col>
                  <Col span={6}>
                    <label style={lbl}>Unit</label>
                    <input
                      type="text"
                      value={formData.condition.unit}
                      onChange={e => handleConditionChange('unit', e.target.value)}
                      style={inputStyle}
                      placeholder="°C, %, kW, etc."
                      onFocus={e => e.target.style.borderColor = '#1890ff'}
                      onBlur={e => e.target.style.borderColor = '#d9d9d9'}
                    />
                  </Col>
                </Row>

                <Row gutter={14} style={{ marginBottom: 12 }}>
                  <Col span={8}>
                    <label style={lbl}>Duration (minutes)</label>
                    <InputNumber
                      value={formData.condition.duration}
                      onChange={v => handleConditionChange('duration', v)}
                      style={{ width: '100%' }} size="small"
                      min={1}
                      max={60}
                      step={1}
                    />
                    <Text type="secondary" style={{ fontSize: 11 }}>How long condition must be met</Text>
                  </Col>
                </Row>

                <Divider orientation="left" style={{ fontSize: 12, margin: '12px 0' }}>
                  <ClockCircleOutlined /> Schedule
                </Divider>

                <Row gutter={14}>
                  <Col span={8}>
                    <label style={lbl}>Start Date</label>
                    <input
                      type="date"
                      value={formData.schedule.startDate}
                      onChange={e => handleScheduleChange('startDate', e.target.value)}
                      style={inputStyle}
                    />
                  </Col>
                  <Col span={8}>
                    <label style={lbl}>End Date (optional)</label>
                    <input
                      type="date"
                      value={formData.schedule.endDate}
                      onChange={e => handleScheduleChange('endDate', e.target.value)}
                      style={inputStyle}
                    />
                  </Col>
                  <Col span={8}>
                    <label style={lbl}>Time Window</label>
                    <Select
                      value={formData.schedule.timeWindow}
                      onChange={v => handleScheduleChange('timeWindow', v)}
                      style={{ width: '100%' }} size="small"
                    >
                      {TIME_WINDOWS.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
                    </Select>
                  </Col>
                </Row>
              </TabPane>

              <TabPane tab="📤 Escalation" key="escalation">
                <div style={{ background: '#fff7e6', padding: '12px 16px', borderRadius: 6, border: '1px solid #ffd591', marginBottom: 12 }}>
                  <Text strong style={{ color: '#fa8c16' }}>📤 Escalation Policy</Text>
                </div>

                <Row gutter={14} style={{ marginBottom: 12 }}>
                  <Col span={6}>
                    <label style={lbl}>Escalation Level</label>
                    <Select
                      value={formData.escalation.level}
                      onChange={v => handleEscalationChange('level', v)}
                      style={{ width: '100%' }} size="small"
                    >
                      {[1, 2, 3, 4, 5].map(l => <Option key={l} value={l}>Level {l}</Option>)}
                    </Select>
                  </Col>
                  <Col span={6}>
                    <label style={lbl}>Max Escalations</label>
                    <InputNumber
                      value={formData.escalation.maxEscalations}
                      onChange={v => handleEscalationChange('maxEscalations', v)}
                      style={{ width: '100%' }} size="small"
                      min={1}
                      max={10}
                    />
                  </Col>
                  <Col span={6}>
                    <label style={lbl}>Escalate After (min)</label>
                    <InputNumber
                      value={formData.escalation.escalateAfter}
                      onChange={v => handleEscalationChange('escalateAfter', v)}
                      style={{ width: '100%' }} size="small"
                      min={1}
                      max={60}
                    />
                  </Col>
                  <Col span={6}>
                    <label style={lbl}>Initial Delay (min)</label>
                    <InputNumber
                      value={formData.escalation.delayMinutes}
                      onChange={v => handleEscalationChange('delayMinutes', v)}
                      style={{ width: '100%' }} size="small"
                      min={0}
                      max={30}
                    />
                  </Col>
                </Row>

                <div style={{ marginBottom: 12 }}>
                  <label style={lbl}>Escalation Actions</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {ESCALATION_ACTIONS.map(action => (
                      <Tag
                        key={action}
                        color={formData.escalation.actions.includes(action) ? '#1890ff' : undefined}
                        style={{ cursor: 'pointer', padding: '2px 8px' }}
                        onClick={() => {
                          const actions = formData.escalation.actions.includes(action)
                            ? formData.escalation.actions.filter(a => a !== action)
                            : [...formData.escalation.actions, action];
                          handleEscalationChange('actions', actions);
                        }}
                      >
                        {formData.escalation.actions.includes(action) ? '✓ ' : ''}{action}
                      </Tag>
                    ))}
                  </div>
                </div>

                <Row gutter={14} style={{ marginBottom: 12 }}>
                  <Col span={24}>
                    <label style={lbl}>Email Template</label>
                    <Select
                      value={formData.escalation.emailTemplate}
                      onChange={v => handleEscalationChange('emailTemplate', v)}
                      style={{ width: '100%' }} size="small"
                    >
                      {EMAIL_TEMPLATES.map(t => <Option key={t} value={t}>{t}</Option>)}
                    </Select>
                  </Col>
                </Row>

                <Divider orientation="left" style={{ fontSize: 12, margin: '8px 0' }}>
                  <MailOutlined /> Notification Channels
                </Divider>

                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {[
                    { key: 'email', label: '📧 Email', defaultChecked: true },
                    { key: 'sms', label: '📱 SMS' },
                    { key: 'slack', label: '💬 Slack/Teams' },
                    { key: 'ticket', label: '🎫 Ticket System' },
                  ].map(channel => (
                    <div key={channel.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Switch
                        size="small"
                        checked={formData.escalation.notificationChannels?.[channel.key] || false}
                        onChange={(checked) => handleNotificationChange(channel.key, checked)}
                      />
                      <span style={{ fontSize: 12 }}>{channel.label}</span>
                    </div>
                  ))}
                </div>

                {formData.escalation.notificationChannels?.email && (
                  <div style={{ marginTop: 12 }}>
                    <label style={lbl}>Email Recipients</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {['admin@datacenter.com', 'noc@datacenter.com', 'engineer@datacenter.com'].map(email => (
                        <Tag
                          key={email}
                          color={formData.escalation.emailRecipients.includes(email) ? 'blue' : undefined}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            const recipients = formData.escalation.emailRecipients.includes(email)
                              ? formData.escalation.emailRecipients.filter(r => r !== email)
                              : [...formData.escalation.emailRecipients, email];
                            handleEscalationChange('emailRecipients', recipients);
                          }}
                        >
                          {formData.escalation.emailRecipients.includes(email) ? '✓ ' : ''}{email}
                        </Tag>
                      ))}
                    </div>
                    <Input
                      placeholder="Add custom email and press Enter"
                      size="small"
                      style={{ marginTop: 4, width: '100%' }}
                      onPressEnter={(e) => {
                        const email = e.target.value.trim();
                        if (email && !formData.escalation.emailRecipients.includes(email)) {
                          handleEscalationChange('emailRecipients', [...formData.escalation.emailRecipients, email]);
                          e.target.value = '';
                        }
                      }}
                    />
                  </div>
                )}
              </TabPane>

              <TabPane tab="⚙️ Advanced" key="advanced">
                <div style={{ background: '#f9f0ff', padding: '12px 16px', borderRadius: 6, border: '1px solid #d3adf7', marginBottom: 12 }}>
                  <Text strong style={{ color: '#722ed1' }}>⚙️ Auto-Remediation</Text>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Switch
                      checked={formData.autoRemediation.enabled}
                      onChange={(checked) => handleAutoRemediationChange('enabled', checked)}
                    />
                    <span style={{ fontSize: 13 }}>Enable Auto-Remediation</span>
                  </div>
                </div>

                {formData.autoRemediation.enabled && (
                  <Row gutter={14}>
                    <Col span={12}>
                      <label style={lbl}>Remediation Action</label>
                      <Select
                        value={formData.autoRemediation.action}
                        onChange={v => handleAutoRemediationChange('action', v)}
                        style={{ width: '100%' }} size="small"
                      >
                        {AUTO_ACTIONS.map(a => <Option key={a.value} value={a.value}>{a.label}</Option>)}
                      </Select>
                    </Col>
                    <Col span={12}>
                      <label style={lbl}>Script Path (optional)</label>
                      <input
                        type="text"
                        value={formData.autoRemediation.scriptPath}
                        onChange={e => handleAutoRemediationChange('scriptPath', e.target.value)}
                        style={inputStyle}
                        placeholder="/path/to/script.sh"
                        onFocus={e => e.target.style.borderColor = '#1890ff'}
                        onBlur={e => e.target.style.borderColor = '#d9d9d9'}
                      />
                    </Col>
                  </Row>
                )}
              </TabPane>
            </Tabs>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
              <Button onClick={closeModal}>Cancel</Button>
              <Button type="primary" loading={loading} onClick={handleSubmit}
                icon={editingRule ? <EditOutlined /> : <PlusOutlined />}
                style={{ background: 'linear-gradient(135deg, #1890ff, #096dd9)', border: 'none' }}>
                {loading ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* ════════════════ REPORT MODAL ════════════════ */}
      {showReportModal && (
        <>
          <div style={backdropStyle} onClick={() => setShowReportModal(false)} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            backgroundColor: 'white', padding: '20px 24px', borderRadius: 10,
            width: '820px', maxWidth: '96%', maxHeight: '92vh', overflowY: 'auto',
            zIndex: 1001, boxShadow: '0 8px 32px rgba(0,0,0,0.18)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'linear-gradient(135deg, #1890ff, #096dd9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <MailOutlined style={{ color: 'white', fontSize: 15 }} />
                </div>
                <h3 style={{ margin: 0, color: '#1890ff', fontSize: 15 }}>
                  {editingReport ? 'Edit Report' : 'Create Scheduled Report'}
                </h3>
              </div>
              <Button type="text" icon={<CloseOutlined />} onClick={() => setShowReportModal(false)} style={{ color: '#666' }} />
            </div>

            <Tabs activeKey={reportFormActiveTab} onChange={setReportFormActiveTab} size="small">
              <TabPane tab="📋 Basic" key="basic">
                <Row gutter={14} style={{ marginBottom: 12 }}>
                  <Col span={16}>
                    <label style={lbl}>Report Name <span style={{ color: '#ff4d4f' }}>*</span></label>
                    <input
                      type="text" name="name"
                      value={reportFormData.name}
                      onChange={handleReportInputChange}
                      style={inputStyle}
                      placeholder="e.g., Daily Power Usage Report"
                      onFocus={e => e.target.style.borderColor = '#1890ff'}
                      onBlur={e => e.target.style.borderColor = '#d9d9d9'}
                    />
                  </Col>
                  <Col span={8}>
                    <label style={lbl}>Status</label>
                    <div style={{ paddingTop: 4 }}>
                      <Switch
                        checked={reportFormData.enabled}
                        onChange={(checked) => handleReportSelectChange('enabled', checked)}
                        checkedChildren="Active"
                        unCheckedChildren="Disabled"
                      />
                    </div>
                  </Col>
                </Row>

                <Row gutter={14} style={{ marginBottom: 12 }}>
                  <Col span={8}>
                    <label style={lbl}>Report Type <span style={{ color: '#ff4d4f' }}>*</span></label>
                    <Select
                      value={reportFormData.reportType}
                      onChange={v => handleReportSelectChange('reportType', v)}
                      style={{ width: '100%' }} size="small"
                    >
                      {REPORT_TYPES.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
                    </Select>
                  </Col>
                  <Col span={8}>
                    <label style={lbl}>Format <span style={{ color: '#ff4d4f' }}>*</span></label>
                    <Select
                      value={reportFormData.reportFormat}
                      onChange={v => handleReportSelectChange('reportFormat', v)}
                      style={{ width: '100%' }} size="small"
                    >
                      {REPORT_FORMATS.map(f => (
                        <Option key={f.value} value={f.value}>
                          <Space size={4}>{f.icon} {f.label}</Space>
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={8}>
                    <label style={lbl}>Schedule Time <span style={{ color: '#ff4d4f' }}>*</span></label>
                    <input
                      type="time"
                      value={reportFormData.scheduleTime}
                      onChange={e => handleReportSelectChange('scheduleTime', e.target.value)}
                      style={inputStyle}
                    />
                  </Col>
                </Row>

                <div>
                  <label style={lbl}>Description</label>
                  <textarea
                    name="description"
                    value={reportFormData.description}
                    onChange={handleReportInputChange}
                    style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
                    placeholder="Enter a brief description of this report..."
                    onFocus={e => e.target.style.borderColor = '#1890ff'}
                    onBlur={e => e.target.style.borderColor = '#d9d9d9'}
                  />
                </div>
              </TabPane>

              <TabPane tab="📧 Recipients" key="recipients">
                <div style={{ background: '#e6f7ff', padding: '12px 16px', borderRadius: 6, border: '1px solid #91d5ff', marginBottom: 12 }}>
                  <Text strong style={{ color: '#1890ff' }}>📧 Email Recipients</Text>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={lbl}>Select Recipients</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {['admin@datacenter.com', 'noc@datacenter.com', 'engineer@datacenter.com', 'facility@datacenter.com', 'ops@datacenter.com', 'management@datacenter.com', 'security@datacenter.com', 'finance@datacenter.com'].map(email => (
                      <Tag
                        key={email}
                        color={reportFormData.recipients.includes(email) ? 'blue' : undefined}
                        style={{ cursor: 'pointer', padding: '2px 8px' }}
                        onClick={() => {
                          if (reportFormData.recipients.includes(email)) {
                            handleReportRecipientRemove(email);
                          } else {
                            handleReportRecipientAdd(email);
                          }
                        }}
                      >
                        {reportFormData.recipients.includes(email) ? '✓ ' : ''}{email}
                      </Tag>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={lbl}>Add Custom Recipient</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Input
                      placeholder="Enter email address"
                      size="small"
                      style={{ flex: 1 }}
                      onPressEnter={(e) => {
                        const email = e.target.value.trim();
                        if (email) {
                          handleReportRecipientAdd(email);
                          e.target.value = '';
                        }
                      }}
                    />
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => {
                        const input = document.querySelector('input[placeholder="Enter email address"]');
                        if (input) {
                          const email = input.value.trim();
                          if (email) {
                            handleReportRecipientAdd(email);
                            input.value = '';
                          }
                        }
                      }}
                      style={{ background: 'linear-gradient(135deg, #1890ff, #096dd9)', border: 'none' }}
                    >
                      Add
                    </Button>
                  </div>
                  <Text type="secondary" style={{ fontSize: 11 }}>Press Enter or click Add to add email</Text>
                </div>

                {reportFormData.recipients.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <label style={lbl}>Selected Recipients ({reportFormData.recipients.length})</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {reportFormData.recipients.map(email => (
                        <Tag
                          key={email}
                          closable
                          onClose={() => handleReportRecipientRemove(email)}
                          color="blue"
                        >
                          {email}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}
              </TabPane>

              <TabPane tab="📊 KPIs" key="kpis">
                <div style={{ background: '#f6ffed', padding: '12px 16px', borderRadius: 6, border: '1px solid #b7eb8f', marginBottom: 12 }}>
                  <Text strong style={{ color: '#52c41a' }}>📊 Select KPIs to Include</Text>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {REPORT_KPIS.map(kpi => (
                    <div
                      key={kpi.value}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: `1px solid ${reportFormData.kpis.includes(kpi.value) ? '#1890ff' : '#d9d9d9'}`,
                        background: reportFormData.kpis.includes(kpi.value) ? '#e6f7ff' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                      onClick={() => handleReportKpiToggle(kpi.value)}
                    >
                      <Checkbox checked={reportFormData.kpis.includes(kpi.value)} />
                      <span style={{ fontSize: 13 }}>{kpi.label}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 12 }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Selected {reportFormData.kpis.length} KPI{reportFormData.kpis.length !== 1 ? 's' : ''}
                  </Text>
                </div>
              </TabPane>

              <TabPane tab="⚙️ Options" key="options">
                <div style={{ background: '#f9f0ff', padding: '12px 16px', borderRadius: 6, border: '1px solid #d3adf7', marginBottom: 12 }}>
                  <Text strong style={{ color: '#722ed1' }}>⚙️ Report Options</Text>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={lbl}>Device Filter</label>
                  <Select
                    value={reportFormData.deviceFilter}
                    onChange={v => handleReportSelectChange('deviceFilter', v)}
                    style={{ width: '100%' }} size="small"
                    showSearch allowClear
                  >
                    {DEVICE_TYPES.map(d => <Option key={d} value={d}>{d}</Option>)}
                  </Select>
                  <Text type="secondary" style={{ fontSize: 11 }}>Filter report data by specific device types</Text>
                </div>

                <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
                  <div>
                    <Checkbox
                      checked={reportFormData.includeCharts}
                      onChange={(e) => handleReportSelectChange('includeCharts', e.target.checked)}
                    >
                      Include Charts
                    </Checkbox>
                    <div style={{ fontSize: 11, color: '#888', marginLeft: 24 }}>Add visual charts to the report</div>
                  </div>
                  <div>
                    <Checkbox
                      checked={reportFormData.includeSummary}
                      onChange={(e) => handleReportSelectChange('includeSummary', e.target.checked)}
                    >
                      Include Summary
                    </Checkbox>
                    <div style={{ fontSize: 11, color: '#888', marginLeft: 24 }}>Add executive summary section</div>
                  </div>
                </div>

                <div style={{ background: '#f0f5ff', padding: '12px 16px', borderRadius: 6, border: '1px solid #adc6ff' }}>
                  <Text strong style={{ color: '#1890ff' }}>📋 Report Preview</Text>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    <div>• Name: <Text strong>{reportFormData.name || '[Report Name]'}</Text></div>
                    <div>• Schedule: <Text strong>{getReportTypeLabel(reportFormData.reportType)} at {reportFormData.scheduleTime}</Text></div>
                    <div>• Format: <Text strong>{getReportFormatLabel(reportFormData.reportFormat)}</Text></div>
                    <div>• Recipients: <Text strong>{reportFormData.recipients.length} recipients</Text></div>
                    <div>• KPIs: <Text strong>{reportFormData.kpis.length} selected</Text></div>
                    <div>• Charts: <Text strong>{reportFormData.includeCharts ? 'Yes' : 'No'}</Text></div>
                    <div>• Summary: <Text strong>{reportFormData.includeSummary ? 'Yes' : 'No'}</Text></div>
                  </div>
                </div>
              </TabPane>
            </Tabs>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
              <Button onClick={() => setShowReportModal(false)}>Cancel</Button>
              <Button type="primary" loading={loading} onClick={handleReportSubmit}
                icon={editingReport ? <EditOutlined /> : <PlusOutlined />}
                style={{ background: 'linear-gradient(135deg, #1890ff, #096dd9)', border: 'none' }}>
                {loading ? 'Saving...' : editingReport ? 'Update Report' : 'Create Report'}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* ════════════════ DELETE MODAL ════════════════ */}
      {showDeleteModal && ruleToDelete && (
        <>
          <div style={backdropStyle} onClick={closeDeleteModal} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            backgroundColor: 'white', padding: '24px', borderRadius: 8,
            width: '440px', maxWidth: '90%', zIndex: 1001,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)', textAlign: 'center'
          }}>
            <ExclamationCircleOutlined style={{ fontSize: 42, color: '#ff4d4f', marginBottom: 10 }} />
            <h3 style={{ color: '#ff4d4f', marginBottom: 6 }}>Delete Item</h3>
            <p style={{ fontSize: 14, marginBottom: 10 }}>Are you sure you want to delete this item?</p>
            <div style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 4, marginBottom: 12, textAlign: 'left', fontSize: 13 }}>
              {[
                ['Name', ruleToDelete.name || ruleToDelete.namespace],
                ['Type', ruleToDelete.severity ? 'Rule' : 'Report'],
                ...(ruleToDelete.severity ? [
                  ['Severity', getSeverityConfig(ruleToDelete.severity)?.label],
                  ['Priority', PRIORITY_LEVELS.find(p => p.id === ruleToDelete.priority)?.label],
                ] : [
                  ['Report Type', getReportTypeLabel(ruleToDelete.reportType)],
                  ['Recipients', ruleToDelete.recipients?.length || 0],
                ]),
                ['Status', ruleToDelete.enabled ? 'Active' : 'Disabled'],
              ].map(([k, v]) => (
                <p key={k} style={{ margin: '3px 0' }}><strong>{k}:</strong> {v}</p>
              ))}
            </div>
            <p style={{ color: '#ff7875', fontSize: 12, marginBottom: 16 }}>This action cannot be undone.</p>
            <Space>
              <Button onClick={closeDeleteModal}>Cancel</Button>
              <Button danger type="primary" onClick={handleReportDelete || handleDelete} icon={<DeleteOutlined />}>Delete</Button>
            </Space>
          </div>
        </>
      )}
    </div>
  );
};

// ── Rule Columns ──
const columns = [
  {
    title: 'ID', dataIndex: 'id', key: 'id', width: 55,
    render: t => <Text style={{ fontSize: 11 }}>#{t}</Text>,
  },
  {
    title: 'Rule', dataIndex: 'name', key: 'name',
    render: (text, record) => (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14 }}>{SEVERITY_LEVELS.find(s => s.id === record.severity)?.icon}</span>
          <Text strong style={{ fontSize: 12 }}>{text}</Text>
          <Tag color={SEVERITY_LEVELS.find(s => s.id === record.severity)?.color} style={{ fontSize: 9, margin: 0, padding: '0 6px' }}>
            {SEVERITY_LEVELS.find(s => s.id === record.severity)?.label}
          </Tag>
          <Tag color={PRIORITY_LEVELS.find(p => p.id === record.priority)?.color} style={{ fontSize: 9, margin: 0, padding: '0 6px' }}>
            {PRIORITY_LEVELS.find(p => p.id === record.priority)?.label}
          </Tag>
        </div>
        <Text type="secondary" style={{ fontSize: 10 }}>
          {record.deviceType} {record.deviceFilter ? `(${record.deviceFilter})` : ''}
        </Text>
      </div>
    ),
  },
  {
    title: 'Condition', key: 'condition', width: 180,
    render: (_, record) => (
      <div>
        <Text style={{ fontSize: 11, fontFamily: 'monospace' }}>
          {record.condition.metric} {record.condition.operator} {record.condition.value}{record.condition.unit}
        </Text>
        <div style={{ fontSize: 10, color: '#888' }}>
          for {record.condition.duration} min
        </div>
      </div>
    ),
  },
  {
    title: 'Escalation', key: 'escalation', width: 140,
    render: (_, record) => (
      <div>
        <Tag color="orange" style={{ fontSize: 9 }}>Level {record.escalation.level}</Tag>
        <div style={{ fontSize: 10, color: '#888' }}>
          {record.escalation.actions.join(', ')}
        </div>
      </div>
    ),
  },
  {
    title: 'Triggers', dataIndex: 'triggerCount', key: 'triggerCount', width: 80,
    render: (count, record) => (
      <div>
        <Badge count={count} style={{ backgroundColor: count > 100 ? '#ff4d4f' : '#1890ff' }} />
        <div style={{ fontSize: 9, color: '#888', marginTop: 2 }}>
          {record.lastTriggered}
        </div>
      </div>
    ),
  },
  {
    title: 'Status', dataIndex: 'enabled', key: 'enabled', width: 85,
    render: (enabled, record) => (
      <Space direction="vertical" size={0}>
        <Badge
          status={enabled ? 'success' : 'default'}
          text={<span style={{ fontSize: 11 }}>{enabled ? 'Active' : 'Disabled'}</span>}
        />
        <Switch
          size="small"
          checked={enabled}
          onChange={() => {
            // This will be handled by the parent component
          }}
          style={{ marginTop: 2 }}
        />
      </Space>
    ),
  },
  {
    title: 'Actions', key: 'actions', width: 80, fixed: 'right',
    render: (_, record) => (
      <Space size={2}>
        <Tooltip title="Edit">
          <Button type="text" size="small" icon={<EditOutlined />}
            style={{ color: '#1890ff', padding: '0 4px' }} />
        </Tooltip>
        <Tooltip title="Delete">
          <Button type="text" size="small" icon={<DeleteOutlined />}
            style={{ color: '#ff4d4f', padding: '0 4px' }} />
        </Tooltip>
      </Space>
    ),
  },
];

export default RulesEngine;