// AddSite.jsx
import React, { useState } from "react";
import {
  Table,
  Tag,
  Row,
  Col,
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
} from "antd";
import {
  EnvironmentOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  GlobalOutlined,
  FlagOutlined,
  IdcardOutlined,
  CloseOutlined,
  StopOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

const AddSite = () => {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState(null);
  const [editingSite, setEditingSite] = useState(null);

  const [formErrors, setFormErrors] = useState({
    siteCode: "",
    siteName: "",
    countryId: "",
    stateId: "",
    cityId: "",
  });

  const countriesList = [
    { id: 1, name: "United States", code: "USA" },
    { id: 2, name: "United Kingdom", code: "GBR" },
    { id: 3, name: "India", code: "IND" },
    { id: 4, name: "Germany", code: "DEU" },
    { id: 5, name: "Japan", code: "JPN" },
    { id: 6, name: "Canada", code: "CAN" },
    { id: 7, name: "Australia", code: "AUS" },
  ];

  const statesList = [
    { id: 1, name: "California", code: "CA", countryId: 1 },
    { id: 2, name: "Texas", code: "TX", countryId: 1 },
    { id: 3, name: "New York", code: "NY", countryId: 1 },
    { id: 4, name: "Ontario", code: "ON", countryId: 6 },
    { id: 5, name: "Quebec", code: "QC", countryId: 6 },
    { id: 6, name: "British Columbia", code: "BC", countryId: 6 },
    { id: 7, name: "Maharashtra", code: "MH", countryId: 3 },
    { id: 8, name: "Karnataka", code: "KA", countryId: 3 },
    { id: 9, name: "Tamil Nadu", code: "TN", countryId: 3 },
    { id: 10, name: "Bavaria", code: "BY", countryId: 4 },
    { id: 11, name: "North Rhine-Westphalia", code: "NW", countryId: 4 },
    { id: 12, name: "Tokyo Metropolis", code: "13", countryId: 5 },
    { id: 13, name: "Osaka", code: "27", countryId: 5 },
    { id: 14, name: "New South Wales", code: "NSW", countryId: 7 },
    { id: 15, name: "Victoria", code: "VIC", countryId: 7 },
  ];

  const citiesList = [
    { id: 1, name: "Los Angeles", code: "LA", stateId: 1, countryId: 1 },
    { id: 2, name: "San Francisco", code: "SF", stateId: 1, countryId: 1 },
    { id: 3, name: "Houston", code: "HOU", stateId: 2, countryId: 1 },
    { id: 4, name: "Austin", code: "AUS", stateId: 2, countryId: 1 },
    { id: 5, name: "New York City", code: "NYC", stateId: 3, countryId: 1 },
    { id: 6, name: "Toronto", code: "TOR", stateId: 4, countryId: 6 },
    { id: 7, name: "Ottawa", code: "OTT", stateId: 4, countryId: 6 },
    { id: 8, name: "Montreal", code: "MTL", stateId: 5, countryId: 6 },
    { id: 9, name: "Vancouver", code: "VAN", stateId: 6, countryId: 6 },
    { id: 10, name: "Mumbai", code: "BOM", stateId: 7, countryId: 3 },
    { id: 11, name: "Pune", code: "PUN", stateId: 7, countryId: 3 },
    { id: 12, name: "Bangalore", code: "BLR", stateId: 8, countryId: 3 },
    { id: 13, name: "Chennai", code: "MAA", stateId: 9, countryId: 3 },
    { id: 14, name: "Munich", code: "MUC", stateId: 10, countryId: 4 },
    { id: 15, name: "Nuremberg", code: "NUE", stateId: 10, countryId: 4 },
    { id: 16, name: "Cologne", code: "CGN", stateId: 11, countryId: 4 },
    { id: 17, name: "Tokyo", code: "TYO", stateId: 12, countryId: 5 },
    { id: 18, name: "Osaka", code: "OSA", stateId: 13, countryId: 5 },
    { id: 19, name: "Sydney", code: "SYD", stateId: 14, countryId: 7 },
    { id: 20, name: "Melbourne", code: "MEL", stateId: 15, countryId: 7 },
  ];


  const [sites, setSites] = useState([
    { id: 1, siteCode: "SITE001", siteName: "Corporate Headquarters", countryId: 1, countryName: "United States", stateId: 1, stateName: "California", cityId: 1, cityName: "Los Angeles", status: "Active", createdDate: "2024-01-15" },
    { id: 2, siteCode: "SITE002", siteName: "North American HQ", countryId: 1, countryName: "United States", stateId: 2, stateName: "Texas", cityId: 3, cityName: "Houston", status: "Active", createdDate: "2024-02-20" },
    { id: 3, siteCode: "SITE003", siteName: "European Office", countryId: 6, countryName: "Canada", stateId: 4, stateName: "Ontario", cityId: 6, cityName: "Toronto", status: "Inactive", createdDate: "2024-03-10" },
    { id: 4, siteCode: "SITE004", siteName: "Asia Pacific Center", countryId: 3, countryName: "India", stateId: 7, stateName: "Maharashtra", cityId: 10, cityName: "Mumbai", status: "Active", createdDate: "2024-04-05" },
  ]);

  const [availableStates, setAvailableStates] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);

  const emptyForm = { siteCode: "", siteName: "", countryId: "", stateId: "", cityId: "", status: true };
  const emptyErrors = { siteCode: "", siteName: "", countryId: "", stateId: "", cityId: "" };

  const [formData, setFormData] = useState(emptyForm);
  const [searchText, setSearchText] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortedInfo, setSortedInfo] = useState({ columnKey: "id", order: "ascend" });

  // ── Computed ──────────────────────────────────────────────────────────────
  const totalCount    = sites.length;
  const activeCount   = sites.filter(s => s.status === "Active").length;
  const inactiveCount = sites.filter(s => s.status !== "Active").length;
  const uniqueCountries = [...new Map(sites.map(s => [s.countryId, { id: s.countryId, name: s.countryName }])).values()];

  const filteredSites = sites.filter(site => {
    const q = searchText.toLowerCase();
    const matchSearch  = !searchText || site.siteName.toLowerCase().includes(q) || site.siteCode.toLowerCase().includes(q) || site.cityName.toLowerCase().includes(q);
    const matchCountry = countryFilter === "all" || site.countryId === countryFilter;
    const matchStatus  = statusFilter  === "all" || site.status === statusFilter;
    return matchSearch && matchCountry && matchStatus;
  });

  // ── Validation ────────────────────────────────────────────────────────────
  const validators = {
    siteCode:  v => !v ? "Site code is required" : v.length < 3 ? "Min 3 characters" : v.length > 20 ? "Max 20 characters" : "",
    siteName:  v => !v ? "Site name is required" : v.length > 100 ? "Max 100 characters" : "",
    countryId: v => !v ? "Country is required" : "",
    stateId:   v => !v ? "State is required" : "",
    cityId:    v => !v ? "City is required" : "",
  };
  const validate    = (field, value) => { const err = validators[field]?.(value) ?? ""; setFormErrors(prev => ({ ...prev, [field]: err })); return err; };
  const validateAll = () => {
    const errs = Object.fromEntries(Object.keys(validators).map(k => [k, validators[k](formData[k])]));
    setFormErrors(errs);
    return Object.values(errs).every(e => !e);
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleInputChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); validate(name, value); };

  const handleCountryChange = (value) => {
    setAvailableStates(statesList.filter(s => s.countryId === value));
    setAvailableCities([]);
    setFormData(prev => ({ ...prev, countryId: value, stateId: "", cityId: "" }));
    validate("countryId", value);
    setFormErrors(prev => ({ ...prev, stateId: "", cityId: "" }));
  };

  const handleStateChange = (value) => {
    setAvailableCities(citiesList.filter(c => c.stateId === value));
    setFormData(prev => ({ ...prev, stateId: value, cityId: "" }));
    validate("stateId", value);
    setFormErrors(prev => ({ ...prev, cityId: "" }));
  };

  const handleCityChange = (value) => {
    setFormData(prev => ({ ...prev, cityId: value }));
    validate("cityId", value);
  };

  const openAddModal = () => {
    setEditingSite(null);
    setFormData(emptyForm);
    setFormErrors(emptyErrors);
    setAvailableStates([]);
    setAvailableCities([]);
    setShowModal(true);
  };

  const openEditModal = (site) => {
    setAvailableStates(statesList.filter(s => s.countryId === site.countryId));
    setAvailableCities(citiesList.filter(c => c.stateId === site.stateId));
    setEditingSite(site);
    setFormData({ siteCode: site.siteCode, siteName: site.siteName, countryId: site.countryId, stateId: site.stateId, cityId: site.cityId, status: site.status === "Active" });
    setFormErrors(emptyErrors);
    setShowModal(true);
  };

  const openDeleteModal  = (site) => { setSiteToDelete(site); setShowDeleteModal(true); };
  const closeModal       = () => { setShowModal(false); setEditingSite(null); };
  const closeDeleteModal = () => { setShowDeleteModal(false); setSiteToDelete(null); };

  const handleDelete = () => {
    if (siteToDelete) { setSites(sites.filter(s => s.id !== siteToDelete.id)); message.success("Site deleted!"); closeDeleteModal(); }
  };

  const handleSubmit = () => {
    if (!validateAll()) { message.error("Please fix the errors in the form"); return; }
    setLoading(true);
    const selCountry = countriesList.find(c => c.id === formData.countryId);
    const selState   = statesList.find(s => s.id === formData.stateId);
    const selCity    = citiesList.find(c => c.id === formData.cityId);
    setTimeout(() => {
      const payload = { ...formData, siteCode: formData.siteCode.toUpperCase(), countryName: selCountry?.name || "", stateName: selState?.name || "", cityName: selCity?.name || "", status: formData.status ? "Active" : "Inactive" };
      if (editingSite) {
        setSites(sites.map(s => s.id === editingSite.id ? { ...s, ...payload } : s));
        message.success("Site updated successfully!");
      } else {
        setSites([...sites, { id: Date.now(), ...payload, createdDate: new Date().toISOString().split("T")[0] }]);
        message.success("Site added successfully!");
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

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 52,
      sorter: (a, b) => a.id - b.id, sortOrder: sortedInfo.columnKey === "id" && sortedInfo.order,
      render: t => <Text style={{ fontSize: 11 }}>{t}</Text> },
    { title: "Site Code", dataIndex: "siteCode", key: "siteCode", width: 90,
      sorter: (a, b) => a.siteCode.localeCompare(b.siteCode), sortOrder: sortedInfo.columnKey === "siteCode" && sortedInfo.order,
      render: t => <Tag color="geekblue" style={{ fontSize: 10 }}>{t}</Tag> },
    { title: "Site Name", dataIndex: "siteName", key: "siteName", width: 160, ellipsis: true,
      sorter: (a, b) => a.siteName.localeCompare(b.siteName), sortOrder: sortedInfo.columnKey === "siteName" && sortedInfo.order,
      render: (t, r) => (
        <Space size={4}>
          <Avatar icon={<EnvironmentOutlined />} style={{ backgroundColor: r.status === "Active" ? "#1890ff" : "#d9d9d9", flexShrink: 0 }} size={20} />
          <Text strong style={{ fontSize: 11 }}>{t}</Text>
        </Space>
      ) },
    { title: "Created Date", dataIndex: "createdDate", key: "createdDate", width: 110,
      sorter: (a, b) => new Date(a.createdDate) - new Date(b.createdDate),
      render: t => <Text style={{ fontSize: 10 }}>{t}</Text> },
    { title: "Status", dataIndex: "status", key: "status", width: 90,
      sorter: (a, b) => a.status.localeCompare(b.status), sortOrder: sortedInfo.columnKey === "status" && sortedInfo.order,
      render: t => <Badge status={t === "Active" ? "success" : "default"} text={<span style={{ fontSize: 11 }}>{t}</span>} />,
      filters: [{ text: "Active", value: "Active" }, { text: "Inactive", value: "Inactive" }],
      onFilter: (v, r) => r.status === v },
    { title: "", key: "actions", width: 72, fixed: "right",
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
            <EnvironmentOutlined style={{ marginRight: 8, color: "#1890ff" }} />
            Site Management
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>Manage company locations and site information</Text>
        </div>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal} size="small"
            style={{ background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)", border: "none" }}>
            Add Site
          </Button>
          <Button icon={<ReloadOutlined />} size="small" onClick={() => window.location.reload()}>Refresh</Button>
        </Space>
      </div>

      {/* ── STAT CARDS ── */}
      <Row gutter={10} style={{ marginBottom: 8, flexShrink: 0 }}>
        <Col span={8}><StatCard label="Total Sites"    value={totalCount}    color="#1890ff" icon={<EnvironmentOutlined style={{ color: "#1890ff" }} />} /></Col>
        <Col span={8}><StatCard label="Active"         value={activeCount}   color="#52c41a" icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />} /></Col>
        <Col span={8}><StatCard label="Inactive"       value={inactiveCount} color="#8c8c8c" icon={<StopOutlined       style={{ color: "#8c8c8c" }} />} /></Col>
      </Row>

      {/* ── FILTERS ── */}
      <div style={{ backgroundColor: "white", borderRadius: 6, padding: "8px 12px", marginBottom: 8, flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={24} md={10} lg={10}>
            <Input placeholder="Search by site name, code, location..." prefix={<SearchOutlined style={{ color: "#bbb" }} />}
              value={searchText} onChange={e => setSearchText(e.target.value)} allowClear size="small" />
          </Col>
          <Col xs={8} sm={6} md={6} lg={6}>
            <Select value={countryFilter} onChange={setCountryFilter} size="small" style={{ width: "100%" }} showSearch optionFilterProp="children">
              <Option value="all">All Countries</Option>
              {uniqueCountries.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
            </Select>
          </Col>
          <Col xs={8} sm={6} md={4} lg={4}>
            <Select value={statusFilter} onChange={setStatusFilter} size="small" style={{ width: "100%" }}>
              <Option value="all">All Status</Option>
              <Option value="Active">Active</Option>
              <Option value="Inactive">Inactive</Option>
            </Select>
          </Col>
          <Col xs={0} sm={0} md={4} lg={4} style={{ textAlign: "right" }}>
            <Text style={{ fontSize: 12, color: "#888", whiteSpace: "nowrap" }}>{filteredSites.length} / {totalCount} shown</Text>
          </Col>
        </Row>
      </div>

      {/* ── TABLE ── */}
      <div style={{ flex: 1, backgroundColor: "white", borderRadius: 6, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ padding: "7px 14px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <Text strong style={{ fontSize: 13 }}>Sites List</Text>
          <Badge count={filteredSites.length} style={{ backgroundColor: "#1890ff" }} />
        </div>
        <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
          <Table
            columns={columns} dataSource={filteredSites} loading={loading}
            bordered={false} rowKey="id" size="small" scroll={{ x: "max-content" }}
            pagination={{ pageSize: 8, showSizeChanger: false, showTotal: total => `${total} sites`, size: "small", style: { padding: "5px 14px", margin: 0 } }}
            onChange={handleTableChange} style={{ fontSize: 12 }}
            locale={{ emptyText: <div style={{ padding: "12px 0", textAlign: "center", color: "#999", fontSize: 13 }}>No data found</div> }}
          />
        </div>
      </div>

     


      {/* ══ ADD / EDIT MODAL ══ */}
      {showModal && (
        <>
          <div style={backdropStyle} onClick={closeModal} />
          <div style={modalBoxStyle("620px")}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: "#1890ff", fontSize: 15 }}>{editingSite ? "Edit Site" : "Add New Site"}</h3>
              <Button type="text" icon={<CloseOutlined />} onClick={closeModal} style={{ color: "#666" }} />
            </div>

            {/* Row 1 — Country + State */}
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={12}>
                <label style={lbl}>Country <span style={{ color: "#ff4d4f" }}>*</span></label>
                <Select placeholder="Select country" style={{ width: "100%" }} size="small"
                  value={formData.countryId || undefined} onChange={handleCountryChange}
                  showSearch optionFilterProp="children" status={formErrors.countryId ? "error" : ""}>
                  {countriesList.map(c => (
                    <Option key={c.id} value={c.id}>
                      <Space size={4}><FlagOutlined style={{ color: "#52c41a" }} />{c.name} ({c.code})</Space>
                    </Option>
                  ))}
                </Select>
                {errText(formErrors.countryId)}
              </Col>
              <Col span={12}>
                <label style={lbl}>State <span style={{ color: "#ff4d4f" }}>*</span></label>
                <Select placeholder={formData.countryId ? "Select state" : "Select country first"} style={{ width: "100%" }} size="small"
                  value={formData.stateId || undefined} onChange={handleStateChange}
                  disabled={!formData.countryId} showSearch optionFilterProp="children" status={formErrors.stateId ? "error" : ""}>
                  {availableStates.map(s => <Option key={s.id} value={s.id}>{s.name} ({s.code})</Option>)}
                </Select>
                {errText(formErrors.stateId)}
              </Col>
            </Row>

            {/* Row 2 — City */}
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={12}>
                <label style={lbl}>City <span style={{ color: "#ff4d4f" }}>*</span></label>
                <Select placeholder={formData.stateId ? "Select city" : "Select state first"} style={{ width: "100%" }} size="small"
                  value={formData.cityId || undefined} onChange={handleCityChange}
                  disabled={!formData.stateId} showSearch optionFilterProp="children" status={formErrors.cityId ? "error" : ""}>
                  {availableCities.map(c => <Option key={c.id} value={c.id}>{c.name} ({c.code})</Option>)}
                </Select>
                {errText(formErrors.cityId)}
              </Col>
            </Row>

            {/* Row 3 — Site Code + Site Name */}
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={12}>
                <label style={lbl}>Site Code <span style={{ color: "#ff4d4f" }}>*</span></label>
                <Input name="siteCode" value={formData.siteCode} onChange={handleInputChange}
                  onBlur={() => validate("siteCode", formData.siteCode)}
                  placeholder="e.g., SITE001" size="small" maxLength={20}
                  prefix={<IdcardOutlined style={{ color: "#bbb" }} />}
                  status={formErrors.siteCode ? "error" : ""} />
                {errText(formErrors.siteCode)}
              </Col>
              <Col span={12}>
                <label style={lbl}>Site Name <span style={{ color: "#ff4d4f" }}>*</span></label>
                <Input name="siteName" value={formData.siteName} onChange={handleInputChange}
                  onBlur={() => validate("siteName", formData.siteName)}
                  placeholder="e.g., Corporate HQ" size="small" maxLength={100}
                  prefix={<EnvironmentOutlined style={{ color: "#bbb" }} />}
                  status={formErrors.siteName ? "error" : ""} />
                {errText(formErrors.siteName)}
              </Col>
            </Row>

            {/* Row 4 — Status */}
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
              <Button type="primary" loading={loading} onClick={handleSubmit} icon={editingSite ? <EditOutlined /> : <PlusOutlined />}>
                {loading ? "Saving..." : editingSite ? "Update Site" : "Create Site"}
              </Button>
            </div>
          </div>
        </>
      )}


      {/* ══ DELETE MODAL ══ */}
      {showDeleteModal && siteToDelete && (
        <>
          <div style={backdropStyle} onClick={closeDeleteModal} />
          <div style={{ ...modalBoxStyle("440px"), textAlign: "center" }}>
            <ExclamationCircleOutlined style={{ fontSize: 40, color: "#ff4d4f", marginBottom: 10 }} />
            <h3 style={{ color: "#ff4d4f", marginBottom: 6 }}>Delete Site</h3>
            <p style={{ fontSize: 14, marginBottom: 10 }}>Are you sure you want to delete this site?</p>
            <div style={{ backgroundColor: "#f5f5f5", padding: 12, borderRadius: 4, marginBottom: 12, textAlign: "left", fontSize: 13 }}>
              {[
                ["Site Code", siteToDelete.siteCode],
                ["Site Name", siteToDelete.siteName],
                ["City",      siteToDelete.cityName],
                ["Country",   siteToDelete.countryName],
                ["Status",    siteToDelete.status],
              ].map(([k, v]) => <p key={k} style={{ margin: "3px 0" }}><strong>{k}:</strong> {v}</p>)}
            </div>
            <p style={{ color: "#ff7875", fontSize: 12, marginBottom: 16 }}>This action cannot be undone.</p>
            <Space>
              <Button onClick={closeDeleteModal}>Cancel</Button>
              <Button danger type="primary" onClick={handleDelete} icon={<DeleteOutlined />}>Delete Site</Button>
            </Space>
          </div>
        </>
      )}

    </div>
  );
};

export default AddSite;