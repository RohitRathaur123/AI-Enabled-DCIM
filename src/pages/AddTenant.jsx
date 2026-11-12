// AddTenant.jsx
import React, { useState } from "react";
import {
  Table, Tag, Row, Col, Typography, Space, Button, Select,
  message, Input, Switch, Divider, Avatar, Tooltip, Badge, InputNumber
} from "antd";
import {
  BankOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
  MailOutlined, PhoneOutlined, GlobalOutlined, EnvironmentOutlined,
  IdcardOutlined, CheckCircleOutlined, TeamOutlined, PlusOutlined,
  SearchOutlined, ExclamationCircleOutlined, CloseOutlined,
  FileTextOutlined, CreditCardOutlined, StopOutlined, FlagOutlined
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

const AddTenant = () => {
  const [loading, setLoading]               = useState(false);
  const [showModal, setShowModal]           = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState(null);
  const [editingTenant, setEditingTenant]   = useState(null);
  const [sortedInfo, setSortedInfo]         = useState({ columnKey: "id", order: "ascend" });

  const emptyForm = {
    tenantName: "", registrationNumber: "", gstNumber: "", panNumber: "",
    bankName: "", accountNumber: "", ifscCode: "",
    email: "", phone: "", website: "",
    address: "", city: "", state: "", country: "", zipCode: "",
    employeeCount: "", status: true
  };
  const emptyErrors = {
    tenantName: "", registrationNumber: "", gstNumber: "", panNumber: "",
    bankName: "", accountNumber: "", ifscCode: "",
    email: "", phone: "", website: "",
    address: "", city: "", state: "", country: "", zipCode: "", employeeCount: ""
  };

  const [formData, setFormData]   = useState(emptyForm);
  const [formErrors, setFormErrors] = useState(emptyErrors);
  const [searchText, setSearchText]   = useState("");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");

  const [tenants, setTenants] = useState([
    { id: 1, tenantName: "Acme Technologies", registrationNumber: "REG123456", gstNumber: "GST1234567890", panNumber: "PAN1234567", bankName: "Bank of America", accountNumber: "123456789", ifscCode: "BOFA1234", email: "info@acmetech.example.com", phone: "+1 234 567 8900", website: "www.acmetech.example.com", address: "123 Tech Park", city: "San Francisco", state: "California", country: "USA", zipCode: "94105", employeeCount: 250, status: "Active", createdDate: "2024-01-15" },
    { id: 2, tenantName: "Tech Solutions Inc", registrationNumber: "REG789012", gstNumber: "GST7890123456", panNumber: "PAN7654321", bankName: "Chase Bank", accountNumber: "987654321", ifscCode: "CHASE5678", email: "contact@techsolutions.com", phone: "+1 234 567 8901", website: "www.techsolutions.com", address: "456 Business Ave", city: "New York", state: "New York", country: "USA", zipCode: "10001", employeeCount: 150, status: "Active", createdDate: "2024-02-20" },
    { id: 3, tenantName: "Data Center Inc", registrationNumber: "REG345678", gstNumber: "GST3456789012", panNumber: "PAN3456789", bankName: "Wells Fargo", accountNumber: "456123789", ifscCode: "WELLS9012", email: "info@datacenter.com", phone: "+1 234 567 8902", website: "www.datacenter.com", address: "789 Data Drive", city: "Austin", state: "Texas", country: "USA", zipCode: "78701", employeeCount: 75, status: "Inactive", createdDate: "2024-03-10" },
    { id: 4, tenantName: "Cloud Solutions Ltd", registrationNumber: "REG901234", gstNumber: "GST9012345678", panNumber: "PAN9012345", bankName: "Citibank", accountNumber: "321654987", ifscCode: "CITI3456", email: "hello@cloudsolutions.com", phone: "+1 234 567 8903", website: "www.cloudsolutions.com", address: "321 Cloud Street", city: "Seattle", state: "Washington", country: "USA", zipCode: "98101", employeeCount: 500, status: "Active", createdDate: "2024-04-05" },
  ]);

  // ── Computed ──────────────────────────────────────────────────────────────
  const totalCount     = tenants.length;
  const activeCount    = tenants.filter(t => t.status === "Active").length;
  const inactiveCount  = tenants.filter(t => t.status !== "Active").length;
  const totalEmployees = tenants.reduce((s, t) => s + (t.employeeCount || 0), 0);
  const uniqueCountries = [...new Set(tenants.map(t => t.country))];

  const filteredTenants = tenants.filter(t => {
    const q = searchText.toLowerCase();
    const matchSearch  = !searchText || t.tenantName.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.city.toLowerCase().includes(q) || t.country.toLowerCase().includes(q) || (t.gstNumber||"").toLowerCase().includes(q) || (t.panNumber||"").toLowerCase().includes(q) || (t.bankName||"").toLowerCase().includes(q);
    const matchStatus  = statusFilter  === "all" || t.status === statusFilter;
    const matchCountry = countryFilter === "all" || t.country === countryFilter;
    return matchSearch && matchStatus && matchCountry;
  });

  // ── Validation ────────────────────────────────────────────────────────────
  const validators = {
    tenantName:         v => !v ? "Tenant name is required" : v.length < 2 ? "Min 2 characters" : v.length > 100 ? "Max 100 characters" : "",
    registrationNumber: v => v && v.length > 50 ? "Max 50 characters" : "",
    gstNumber:          v => { if (!v) return ""; return !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[A-Z0-9]{1}$/.test(v) ? "Invalid GST format (e.g., 22AAAAA0000A1Z5)" : ""; },
    panNumber:          v => { if (!v) return ""; return !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v) ? "Invalid PAN format (e.g., ABCDE1234F)" : ""; },
    bankName:           v => v && v.length > 100 ? "Max 100 characters" : "",
    accountNumber:      v => { if (!v) return ""; return !/^\d{9,18}$/.test(v) ? "Must be 9-18 digits" : ""; },
    ifscCode:           v => { if (!v) return ""; return !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(v) ? "Invalid IFSC (e.g., HDFC0001234)" : ""; },
    email:              v => !v ? "Email is required" : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Invalid email format" : "",
    phone:              v => { if (!v) return ""; return !/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,4}$/.test(v) ? "Invalid phone format" : ""; },
    website:            v => { if (!v) return ""; return !/^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/.test(v) ? "Invalid website URL" : ""; },
    address:            v => v && v.length > 200 ? "Max 200 characters" : "",
    city:               v => v && !/^[a-zA-Z\s-]+$/.test(v) ? "Letters, spaces, hyphens only" : "",
    state:              v => v && !/^[a-zA-Z\s-]+$/.test(v) ? "Letters, spaces, hyphens only" : "",
    country:            v => v && !/^[a-zA-Z\s-]+$/.test(v) ? "Letters, spaces, hyphens only" : "",
    zipCode:            v => v && !/^[A-Z0-9\s-]{3,10}$/i.test(v) ? "Invalid postal code" : "",
    employeeCount:      v => { if (!v && v !== 0) return ""; const n = Number(v); return isNaN(n) || n < 0 ? "Must be a non-negative number" : n > 1000000 ? "Cannot exceed 1,000,000" : ""; },
  };
  const validate    = (field, value) => { const err = validators[field]?.(value) ?? ""; setFormErrors(prev => ({ ...prev, [field]: err })); return err; };
  const validateAll = () => {
    const errs = Object.fromEntries(Object.keys(validators).map(k => [k, validators[k](formData[k])]));
    setFormErrors(errs);
    return Object.values(errs).every(e => !e);
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleInputChange  = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); validate(name, value); };
  const handleNumberChange = (name, value) => { setFormData(prev => ({ ...prev, [name]: value })); validate(name, value); };

  const openAddModal = () => {
    setEditingTenant(null); setFormData(emptyForm); setFormErrors(emptyErrors); setShowModal(true);
  };
  const openEditModal = (t) => {
    setEditingTenant(t);
    setFormData({ tenantName: t.tenantName, registrationNumber: t.registrationNumber, gstNumber: t.gstNumber||"", panNumber: t.panNumber||"", bankName: t.bankName||"", accountNumber: t.accountNumber||"", ifscCode: t.ifscCode||"", email: t.email, phone: t.phone, website: t.website, address: t.address, city: t.city, state: t.state, country: t.country, zipCode: t.zipCode, employeeCount: t.employeeCount, status: t.status === "Active" });
    setFormErrors(emptyErrors);
    setShowModal(true);
  };
  const openDeleteModal  = (t) => { setTenantToDelete(t); setShowDeleteModal(true); };
  const closeModal       = () => { setShowModal(false); setEditingTenant(null); };
  const closeDeleteModal = () => { setShowDeleteModal(false); setTenantToDelete(null); };

  const handleDelete = () => {
    if (tenantToDelete) { setTenants(tenants.filter(t => t.id !== tenantToDelete.id)); message.success("Tenant deleted!"); closeDeleteModal(); }
  };

  const handleSubmit = () => {
    if (!validateAll()) { message.error("Please fix the errors in the form"); return; }
    setLoading(true);
    setTimeout(() => {
      const payload = {
        ...formData,
        registrationNumber: formData.registrationNumber || "-",
        gstNumber: formData.gstNumber || "-", panNumber: formData.panNumber || "-",
        bankName: formData.bankName || "-", accountNumber: formData.accountNumber || "-",
        ifscCode: formData.ifscCode || "-", phone: formData.phone || "-",
        website: formData.website || "-", address: formData.address || "-",
        city: formData.city || "-", state: formData.state || "-",
        country: formData.country || "-", zipCode: formData.zipCode || "-",
        employeeCount: formData.employeeCount ? parseInt(formData.employeeCount) : 0,
        status: formData.status ? "Active" : "Inactive"
      };
      if (editingTenant) {
        setTenants(tenants.map(t => t.id === editingTenant.id ? { ...t, ...payload } : t));
        message.success("Tenant updated successfully!");
      } else {
        setTenants([...tenants, { id: Date.now(), ...payload, createdDate: new Date().toISOString().split("T")[0] }]);
        message.success("Tenant added successfully!");
      }
      setLoading(false); closeModal();
    }, 500);
  };

  const handleTableChange = (_, __, sorter) => setSortedInfo(sorter);

  // ── Stat Card ─────────────────────────────────────────────────────────────
  const StatCard = ({ label, value, color, icon }) => (
    <div style={{ backgroundColor: "white", borderRadius: 6, padding: "8px 14px", borderTop: `3px solid ${color}`, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 22, color }}>{icon}</span>
      <div>
        <div style={{ fontSize: 11, color: "#888", lineHeight: 1.3 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
      </div>
    </div>
  );

  // ── Shared style tokens ───────────────────────────────────────────────────
  const backdropStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000 };
  const modalBoxStyle = (width) => ({ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", backgroundColor: "white", padding: "20px", borderRadius: "8px", width, maxWidth: "95%", maxHeight: "92vh", overflowY: "auto", zIndex: 1001, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" });
  const lbl     = { display: "block", marginBottom: 4, fontWeight: 500, fontSize: 13 };
  const errText = (msg) => msg ? <Text type="danger" style={{ fontSize: 11, marginTop: 2, display: "block" }}>{msg}</Text> : null;
  const field   = (name, label, placeholder, opts = {}) => (
    <div>
      <label style={lbl}>{label}{opts.required && <span style={{ color: "#ff4d4f" }}> *</span>}</label>
      <Input name={name} value={formData[name]} onChange={handleInputChange}
        onBlur={() => validate(name, formData[name])}
        placeholder={placeholder} size="small" maxLength={opts.maxLen || 100}
        style={{ textTransform: opts.upper ? "uppercase" : undefined }}
        status={formErrors[name] ? "error" : ""} />
      {errText(formErrors[name])}
    </div>
  );

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 48,
      sorter: (a, b) => a.id - b.id, sortOrder: sortedInfo.columnKey === "id" && sortedInfo.order,
      render: t => <Text style={{ fontSize: 11 }}>{t}</Text> },
    { title: "Tenant", key: "tenant", width: 150, ellipsis: true,
      sorter: (a, b) => a.tenantName.localeCompare(b.tenantName), sortOrder: sortedInfo.columnKey === "tenant" && sortedInfo.order,
      render: (_, r) => (
        <Space size={4}>
          <Avatar icon={<BankOutlined />} style={{ backgroundColor: r.status === "Active" ? "#1890ff" : "#d9d9d9", flexShrink: 0 }} size={20} />
          <div>
            <Text strong style={{ fontSize: 11 }}>{r.tenantName}</Text>
            <div><Tag color="purple" style={{ fontSize: 9, padding: "0 3px", lineHeight: "16px", marginTop: 1 }}>{r.registrationNumber}</Tag></div>
          </div>
        </Space>
      ) },
    { title: "GST / PAN", key: "gstpan", width: 150,
      render: (_, r) => (
        <div>
          <Space size={4}><FileTextOutlined style={{ color: "#fa8c16", fontSize: 10 }} /><Text style={{ fontSize: 10 }}>{r.gstNumber}</Text></Space>
          <div><Space size={4}><IdcardOutlined style={{ color: "#eb2f96", fontSize: 10 }} /><Text style={{ fontSize: 10 }}>{r.panNumber}</Text></Space></div>
        </div>
      ) },
    { title: "Bank Details", key: "bank", width: 165,
      sorter: (a, b) => (a.bankName||"").localeCompare(b.bankName||""),
      render: (_, r) => (
        <div>
          <Space size={4}><CreditCardOutlined style={{ color: "#52c41a", fontSize: 10 }} /><Text strong style={{ fontSize: 11 }}>{r.bankName}</Text></Space>
          <div><Text type="secondary" style={{ fontSize: 10 }}>A/C: {r.accountNumber} · IFSC: {r.ifscCode}</Text></div>
        </div>
      ) },
    { title: "Contact", key: "contact", width: 175, ellipsis: true,
      sorter: (a, b) => a.email.localeCompare(b.email),
      render: (_, r) => (
        <div>
          <Space size={4}><MailOutlined style={{ color: "#1890ff", fontSize: 10 }} /><Text style={{ fontSize: 10 }}>{r.email}</Text></Space>
          <div><Space size={4}><PhoneOutlined style={{ color: "#52c41a", fontSize: 10 }} /><Text style={{ fontSize: 10 }}>{r.phone}</Text></Space></div>
        </div>
      ) },
    { title: "Location", key: "location", width: 120,
      sorter: (a, b) => a.city.localeCompare(b.city),
      render: (_, r) => (
        <div>
          <Space size={4}><EnvironmentOutlined style={{ color: "#ff4d4f", fontSize: 10 }} /><Text style={{ fontSize: 10 }}>{r.city}</Text></Space>
          <div><Text type="secondary" style={{ fontSize: 10 }}>{r.country}</Text></div>
        </div>
      ) },
    { title: "Emp.", dataIndex: "employeeCount", key: "employeeCount", width: 62,
      sorter: (a, b) => a.employeeCount - b.employeeCount,
      render: t => <Badge count={t} style={{ backgroundColor: "#722ed1" }} overflowCount={999999} /> },
    { title: "Created", dataIndex: "createdDate", key: "createdDate", width: 88,
      sorter: (a, b) => new Date(a.createdDate) - new Date(b.createdDate),
      render: t => <Text style={{ fontSize: 10 }}>{t}</Text> },
    { title: "Status", dataIndex: "status", key: "status", width: 82,
      sorter: (a, b) => a.status.localeCompare(b.status), sortOrder: sortedInfo.columnKey === "status" && sortedInfo.order,
      render: t => <Badge status={t === "Active" ? "success" : "default"} text={<span style={{ fontSize: 11 }}>{t}</span>} />,
      filters: [{ text: "Active", value: "Active" }, { text: "Inactive", value: "Inactive" }],
      onFilter: (v, r) => r.status === v },
    { title: "", key: "actions", width: 60, fixed: "right",
      render: (_, r) => (
        <Space size={0}>
          <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditModal(r)} style={{ color: "#1890ff", padding: "0 3px" }} /></Tooltip>
          <Tooltip title="Delete"><Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => openDeleteModal(r)} style={{ color: "#ff4d4f", padding: "0 3px" }} /></Tooltip>
        </Space>
      ) },
  ];

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f0f2f5", padding: "10px 16px", boxSizing: "border-box", overflow: "hidden" }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexShrink: 0 }}>
        <div>
          <Title level={4} style={{ margin: 0, lineHeight: 1.3 }}>
            <BankOutlined style={{ marginRight: 8, color: "#1890ff" }} />
            Tenant Management
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>Manage tenant information and details</Text>
        </div>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal} size="small"
            style={{ background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)", border: "none" }}>
            Add Tenant
          </Button>
          <Button icon={<ReloadOutlined />} size="small" onClick={() => window.location.reload()}>Refresh</Button>
        </Space>
      </div>

      {/* ── STAT CARDS ── */}
      <Row gutter={10} style={{ marginBottom: 8, flexShrink: 0 }}>
        <Col span={6}><StatCard label="Total Tenants"    value={totalCount}     color="#1890ff" icon={<BankOutlined        style={{ color: "#1890ff" }} />} /></Col>
        <Col span={6}><StatCard label="Active"           value={activeCount}    color="#52c41a" icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />} /></Col>
        <Col span={6}><StatCard label="Inactive"         value={inactiveCount}  color="#8c8c8c" icon={<StopOutlined        style={{ color: "#8c8c8c" }} />} /></Col>
        <Col span={6}><StatCard label="Total Employees"  value={totalEmployees} color="#722ed1" icon={<TeamOutlined        style={{ color: "#722ed1" }} />} /></Col>
      </Row>

      {/* ── FILTERS ── */}
      <div style={{ backgroundColor: "white", borderRadius: 6, padding: "8px 12px", marginBottom: 8, flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={24} md={10} lg={10}>
            <Input placeholder="Search by name, email, city, GST, PAN, bank..." prefix={<SearchOutlined style={{ color: "#bbb" }} />}
              value={searchText} onChange={e => setSearchText(e.target.value)} allowClear size="small" />
          </Col>
          <Col xs={8} sm={6} md={5} lg={5}>
            <Select value={countryFilter} onChange={setCountryFilter} size="small" style={{ width: "100%" }}>
              <Option value="all">All Countries</Option>
              {uniqueCountries.map(c => <Option key={c} value={c}>{c}</Option>)}
            </Select>
          </Col>
          <Col xs={8} sm={6} md={4} lg={4}>
            <Select value={statusFilter} onChange={setStatusFilter} size="small" style={{ width: "100%" }}>
              <Option value="all">All Status</Option>
              <Option value="Active">Active</Option>
              <Option value="Inactive">Inactive</Option>
            </Select>
          </Col>
          <Col xs={0} sm={0} md={5} lg={5} style={{ textAlign: "right" }}>
            <Text style={{ fontSize: 12, color: "#888", whiteSpace: "nowrap" }}>{filteredTenants.length} / {totalCount} shown</Text>
          </Col>
        </Row>
      </div>

      {/* ── TABLE ── */}
      <div style={{ flex: 1, backgroundColor: "white", borderRadius: 6, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ padding: "7px 14px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <Text strong style={{ fontSize: 13 }}>Tenants List</Text>
          <Badge count={filteredTenants.length} style={{ backgroundColor: "#1890ff" }} />
        </div>
        <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
          <Table
            columns={columns} dataSource={filteredTenants} loading={loading}
            bordered={false} rowKey="id" size="small" scroll={{ x: "max-content" }}
            pagination={{ pageSize: 8, showSizeChanger: false, showTotal: total => `${total} tenants`, size: "small", style: { padding: "5px 14px", margin: 0 } }}
            onChange={handleTableChange} style={{ fontSize: 12 }}
            locale={{ emptyText: <div style={{ padding: "12px 0", textAlign: "center", color: "#999", fontSize: 13 }}>No data found</div> }}
          />
        </div>
      </div>



      {/* ══ ADD / EDIT MODAL ══ */}
      {showModal && (
        <>
          <div style={backdropStyle} onClick={closeModal} />
          <div style={modalBoxStyle("860px")}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: "#1890ff", fontSize: 15 }}>{editingTenant ? "Edit Tenant" : "Add New Tenant"}</h3>
              <Button type="text" icon={<CloseOutlined />} onClick={closeModal} style={{ color: "#666" }} />
            </div>

            {/* Row 1 — Tenant Name + Registration */}
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={12}>{field("tenantName", "Tenant Name", "e.g., Acme Technologies", { required: true, maxLen: 100 })}</Col>
              <Col span={12}>{field("registrationNumber", "Registration Number", "e.g., REG123456", { maxLen: 50 })}</Col>
            </Row>

            {/* Row 2 — GST + PAN */}
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={12}>{field("gstNumber", "GST Number", "e.g., 22AAAAA0000A1Z5", { maxLen: 15, upper: true })}</Col>
              <Col span={12}>{field("panNumber", "PAN Number", "e.g., ABCDE1234F", { maxLen: 10, upper: true })}</Col>
            </Row>

            <Divider style={{ margin: "10px 0" }}>
              <Space size={4}><CreditCardOutlined style={{ color: "#52c41a" }} /><Text style={{ fontSize: 12 }} strong>Bank Account Details</Text></Space>
            </Divider>

            {/* Row 3 — Bank Name (full width) */}
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={24}>{field("bankName", "Bank Name", "e.g., Bank of America", { maxLen: 100 })}</Col>
            </Row>

            {/* Row 4 — Account Number + IFSC */}
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={12}>{field("accountNumber", "Account Number", "e.g., 123456789", { maxLen: 18 })}</Col>
              <Col span={12}>{field("ifscCode", "IFSC Code", "e.g., HDFC0001234", { maxLen: 11, upper: true })}</Col>
            </Row>

            <Divider style={{ margin: "10px 0" }}>
              <Space size={4}><MailOutlined style={{ color: "#1890ff" }} /><Text style={{ fontSize: 12 }} strong>Contact Information</Text></Space>
            </Divider>

            {/* Row 5 — Email + Phone */}
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={12}>{field("email", "Email", "e.g., info@company.com", { required: true, maxLen: 100 })}</Col>
              <Col span={12}>{field("phone", "Phone", "e.g., +1 234 567 8900", { maxLen: 20 })}</Col>
            </Row>

            {/* Row 6 — Website */}
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={24}>{field("website", "Website", "e.g., www.company.com", { maxLen: 100 })}</Col>
            </Row>

            <Divider style={{ margin: "10px 0" }}>
              <Space size={4}><EnvironmentOutlined style={{ color: "#ff4d4f" }} /><Text style={{ fontSize: 12 }} strong>Address Information</Text></Space>
            </Divider>

            {/* Row 7 — Address (full width textarea) */}
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={24}>
                <label style={lbl}>Address</label>
                <Input.TextArea name="address" value={formData.address} onChange={handleInputChange}
                  onBlur={() => validate("address", formData.address)}
                  placeholder="Enter street address" maxLength={200} rows={2} size="small"
                  status={formErrors.address ? "error" : ""} />
                {errText(formErrors.address)}
              </Col>
            </Row>

            {/* Row 8 — City + State + Zip */}
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={8}>{field("city",    "City",     "e.g., San Francisco", { maxLen: 50 })}</Col>
              <Col span={8}>{field("state",   "State",    "e.g., California",    { maxLen: 50 })}</Col>
              <Col span={8}>{field("zipCode", "Zip Code", "e.g., 94105",         { maxLen: 10 })}</Col>
            </Row>

            {/* Row 9 — Country + Employee Count */}
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={12}>{field("country", "Country", "e.g., USA", { maxLen: 50 })}</Col>
              <Col span={12}>
                <label style={lbl}>Employee Count</label>
                <InputNumber value={formData.employeeCount} onChange={v => handleNumberChange("employeeCount", v)}
                  onBlur={() => validate("employeeCount", formData.employeeCount)}
                  style={{ width: "100%" }} size="small" placeholder="e.g., 250"
                  min={0} max={1000000} step={1}
                  status={formErrors.employeeCount ? "error" : ""} />
                {errText(formErrors.employeeCount)}
              </Col>
            </Row>

            {/* Row 10 — Status */}
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={12}>
                <label style={lbl}>Status</label>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                  <Switch checked={formData.status} onChange={checked => setFormData(prev => ({ ...prev, status: checked }))}
                    checkedChildren="Active" unCheckedChildren="Inactive"
                    style={{ backgroundColor: formData.status ? "#52c41a" : "#ff4d4f" }} />
                  <Text style={{ fontSize: 12, color: formData.status ? "#52c41a" : "#ff4d4f", fontWeight: 500 }}>
                    {formData.status ? "Active" : "Inactive"}
                  </Text>
                </div>
              </Col>
            </Row>

            <Divider style={{ margin: "12px 0" }} />
            <div style={{ textAlign: "right" }}>
              <Button onClick={closeModal} style={{ marginRight: 8 }}>Cancel</Button>
              <Button type="primary" loading={loading} onClick={handleSubmit} icon={editingTenant ? <EditOutlined /> : <PlusOutlined />}>
                {loading ? "Saving..." : editingTenant ? "Update Tenant" : "Create Tenant"}
              </Button>
            </div>
          </div>
        </>
      )}


      {/* ══ DELETE MODAL ══ */}
      {showDeleteModal && tenantToDelete && (
        <>
          <div style={backdropStyle} onClick={closeDeleteModal} />
          <div style={{ ...modalBoxStyle("460px"), textAlign: "center" }}>
            <ExclamationCircleOutlined style={{ fontSize: 40, color: "#ff4d4f", marginBottom: 10 }} />
            <h3 style={{ color: "#ff4d4f", marginBottom: 6 }}>Delete Tenant</h3>
            <p style={{ fontSize: 14, marginBottom: 10 }}>Are you sure you want to delete this tenant?</p>
            <div style={{ backgroundColor: "#f5f5f5", padding: 12, borderRadius: 4, marginBottom: 12, textAlign: "left", fontSize: 13 }}>
              {[
                ["Tenant",     tenantToDelete.tenantName],
                ["Email",      tenantToDelete.email],
                ["GST",        tenantToDelete.gstNumber],
                ["PAN",        tenantToDelete.panNumber],
                ["Bank",       tenantToDelete.bankName],
                ["A/C No",     tenantToDelete.accountNumber],
                ["IFSC",       tenantToDelete.ifscCode],
                ["Location",   `${tenantToDelete.city}, ${tenantToDelete.country}`],
                ["Employees",  tenantToDelete.employeeCount],
                ["Status",     tenantToDelete.status],
              ].map(([k, v]) => <p key={k} style={{ margin: "3px 0" }}><strong>{k}:</strong> {v}</p>)}
            </div>
            <p style={{ color: "#ff7875", fontSize: 12, marginBottom: 16 }}>This action cannot be undone.</p>
            <Space>
              <Button onClick={closeDeleteModal}>Cancel</Button>
              <Button danger type="primary" onClick={handleDelete} icon={<DeleteOutlined />}>Delete Tenant</Button>
            </Space>
          </div>
        </>
      )}

    </div>
  );
};

export default AddTenant;