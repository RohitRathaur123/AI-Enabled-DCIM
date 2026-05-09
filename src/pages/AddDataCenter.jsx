// AddDataCenter.jsx
import React, { useState } from "react";
import {
  Table, Row, Col, Typography, Space, Button, Select,
  message, Input, Switch, Divider, Avatar, Tooltip, Badge,
  InputNumber, Progress
} from "antd";
import {
  CloudServerOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
  MailOutlined, PhoneOutlined, GlobalOutlined, EnvironmentOutlined,
  CheckCircleOutlined, StopOutlined, PlusOutlined, SearchOutlined,
  ExclamationCircleOutlined, CloseOutlined, FlagOutlined, ShopOutlined,
  UserOutlined, BuildOutlined, CompassOutlined, ThunderboltOutlined,
  HeatMapOutlined, ApiOutlined, DashboardOutlined, EyeOutlined,
  CodeOutlined
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

const AddDataCenter = () => {
  const [loading, setLoading]               = useState(false);
  const [showModal, setShowModal]           = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dcToDelete, setDcToDelete]         = useState(null);
  const [editingDC, setEditingDC]           = useState(null);
  const [sortedInfo, setSortedInfo]         = useState({ columnKey: "id", order: "ascend" });
  const [searchText, setSearchText]         = useState("");
  const [countryFilter, setCountryFilter]   = useState("all");
  const [statusFilter, setStatusFilter]     = useState("all");
  const [availableStates, setAvailableStates] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [availableSites, setAvailableSites]   = useState([]);

  // ── Reference Data ────────────────────────────────────────────────────────
  const tenantsList = [
    { id:1, name:"Acme Corporation",  code:"ACME", type:"Enterprise" },
    { id:2, name:"TechGlobal Inc",    code:"TGI",  type:"Enterprise" },
    { id:3, name:"CloudServe",        code:"CS",   type:"Service Provider" },
    { id:4, name:"DataBank",          code:"DB",   type:"Colocation" },
    { id:5, name:"NetSolutions",      code:"NS",   type:"Enterprise" },
  ];
  const countriesList = [
    { id:1, name:"United States", code:"USA" },
    { id:3, name:"India",         code:"IND" },
    { id:6, name:"Canada",        code:"CAN" },
    { id:8, name:"Singapore",     code:"SGP" },
  ];
  const statesList = [
    { id:1,  name:"California",    code:"CA",  countryId:1 },
    { id:2,  name:"Texas",         code:"TX",  countryId:1 },
    { id:4,  name:"Virginia",      code:"VA",  countryId:1 },
    { id:5,  name:"Ontario",       code:"ON",  countryId:6 },
    { id:8,  name:"Maharashtra",   code:"MH",  countryId:3 },
    { id:9,  name:"Karnataka",     code:"KA",  countryId:3 },
    { id:17, name:"Central Region",code:"CR",  countryId:8 },
  ];
  const citiesList = [
    { id:1,  name:"Los Angeles",   code:"LAX", stateId:1,  countryId:1 },
    { id:2,  name:"San Francisco", code:"SFO", stateId:1,  countryId:1 },
    { id:9,  name:"Ashburn",       code:"IAD", stateId:4,  countryId:1 },
    { id:11, name:"Toronto",       code:"YYZ", stateId:5,  countryId:6 },
    { id:15, name:"Mumbai",        code:"BOM", stateId:8,  countryId:3 },
    { id:17, name:"Bangalore",     code:"BLR", stateId:9,  countryId:3 },
    { id:26, name:"Singapore",     code:"SIN", stateId:17, countryId:8 },
  ];
  const sitesList = [
    { id:1,  name:"Building A",       code:"BLD-A", cityId:1  },
    { id:3,  name:"Building C",       code:"BLD-C", cityId:2  },
    { id:10, name:"Campus A",         code:"CA",    cityId:9  },
    { id:12, name:"Core Building",    code:"CORE",  cityId:11 },
    { id:14, name:"DC Building",      code:"DCB",   cityId:15 },
    { id:15, name:"Hub 1",            code:"H1",    cityId:17 },
    { id:19, name:"Singapore Site 1", code:"SGS1",  cityId:26 },
  ];
  const usersList = [
    { id:1, name:"John Smith",    email:"john.smith@datacenter.com",  phone:"+1 213 555 1234",  role:"Facility Manager"   },
    { id:2, name:"Jane Doe",      email:"jane.doe@datacenter.com",    phone:"+1 415 555 5678",  role:"Operations Lead"    },
    { id:3, name:"Mike Wilson",   email:"mike.wilson@datacenter.ca",  phone:"+1 416 555 9012",  role:"Site Supervisor"    },
    { id:4, name:"Rajesh Kumar",  email:"rajesh.kumar@datacenter.in", phone:"+91 22 5555 1234", role:"DC Manager"         },
    { id:5, name:"Sarah Tan",     email:"sarah.tan@datacenter.sg",    phone:"+65 6789 0123",    role:"Regional Head"      },
  ];

  const emptyForm = {
    dataCenterName:"", dataCenterCode:"", countryId:"", stateId:"", cityId:"",
    locationName:"", streetAddress:"", pinCode:"", latitude:"", longitude:"",
    siteId:"", tenantId:"", totalRacks:"", utilizedRacks:"",
    powerCapacity:"", coolingCapacity:"", contactPersonId:"",
    contactEmail:"", contactPhone:"", status: true
  };
  const emptyErrors = Object.fromEntries(Object.keys(emptyForm).map(k => [k, ""]));

  const [formData, setFormData]   = useState(emptyForm);
  const [formErrors, setFormErrors] = useState(emptyErrors);

  const [dataCenters, setDataCenters] = useState([
    { id:1, dataCenterName:"LAX1 - Main Facility", dataCenterCode:"LAX-MAIN-01", countryId:1, countryName:"United States", stateId:1, stateName:"California", cityId:1, cityName:"Los Angeles", locationName:"Main Data Center", streetAddress:"123 Main Street", pinCode:"90001", latitude:"34.0522", longitude:"-118.2437", siteId:1, siteName:"Building A", tenantId:1, tenantName:"Acme Corporation", totalRacks:500, utilizedRacks:325, powerCapacity:2500, coolingCapacity:750, contactPersonId:1, contactPersonName:"John Smith", contactEmail:"john.smith@datacenter.com", contactPhone:"+1 213 555 1234", status:"Active",      createdDate:"2024-01-15" },
    { id:2, dataCenterName:"SFO - Edge Facility",  dataCenterCode:"SFO-EDGE-02", countryId:1, countryName:"United States", stateId:1, stateName:"California", cityId:2, cityName:"San Francisco", locationName:"Edge Facility - West", streetAddress:"456 Market Street", pinCode:"94105", latitude:"37.7749", longitude:"-122.4194", siteId:3, siteName:"Building C", tenantId:2, tenantName:"TechGlobal Inc", totalRacks:250, utilizedRacks:180, powerCapacity:1200, coolingCapacity:350, contactPersonId:2, contactPersonName:"Jane Doe",   contactEmail:"jane.doe@datacenter.com",    contactPhone:"+1 415 555 5678",  status:"Active",       createdDate:"2024-02-20" },
    { id:3, dataCenterName:"TOR - Core Facility",  dataCenterCode:"TOR-CORE-03", countryId:6, countryName:"Canada",        stateId:5, stateName:"Ontario",    cityId:11,cityName:"Toronto",       locationName:"Toronto Core",        streetAddress:"789 Bay Street",    pinCode:"M5G 2C8", latitude:"43.6532", longitude:"-79.3832", siteId:12,siteName:"Core Building",    tenantId:3, tenantName:"CloudServe",      totalRacks:400, utilizedRacks:220, powerCapacity:2000, coolingCapacity:600, contactPersonId:3, contactPersonName:"Mike Wilson", contactEmail:"mike.wilson@datacenter.ca", contactPhone:"+1 416 555 9012",  status:"Active",       createdDate:"2024-03-10" },
    { id:4, dataCenterName:"MUM - DR Site",        dataCenterCode:"MUM-DR-04",   countryId:3, countryName:"India",         stateId:8, stateName:"Maharashtra",cityId:15,cityName:"Mumbai",         locationName:"Mumbai DC",           streetAddress:"321 Business Park", pinCode:"400001", latitude:"19.0760", longitude:"72.8777", siteId:14,siteName:"DC Building",      tenantId:4, tenantName:"DataBank",        totalRacks:150, utilizedRacks:75,  powerCapacity:800,  coolingCapacity:200, contactPersonId:4, contactPersonName:"Rajesh Kumar",contactEmail:"rajesh.kumar@datacenter.in",contactPhone:"+91 22 5555 1234", status:"Maintenance",  createdDate:"2024-04-05" },
    { id:5, dataCenterName:"SIN - Hub Facility",   dataCenterCode:"SIN-HUB-05",  countryId:8, countryName:"Singapore",     stateId:17,stateName:"Central Region",cityId:26,cityName:"Singapore",  locationName:"Singapore Hub",       streetAddress:"1 Raffles Place",   pinCode:"048616", latitude:"1.2843",  longitude:"103.8510", siteId:19,siteName:"Singapore Site 1",tenantId:5, tenantName:"NetSolutions",    totalRacks:300, utilizedRacks:290, powerCapacity:1500, coolingCapacity:450, contactPersonId:5, contactPersonName:"Sarah Tan",  contactEmail:"sarah.tan@datacenter.sg",  contactPhone:"+65 6789 0123",    status:"Warning",      createdDate:"2024-05-12" },
  ]);

  // ── Computed ──────────────────────────────────────────────────────────────
  const totalCount       = dataCenters.length;
  const activeCount      = dataCenters.filter(d => d.status === "Active").length;
  const maintenanceCount = dataCenters.filter(d => d.status === "Maintenance").length;
  const warningCount     = dataCenters.filter(d => d.status === "Warning").length;
  const totalRacksCap    = dataCenters.reduce((s, d) => s + (d.totalRacks || 0), 0);
  const totalRacksUsed   = dataCenters.reduce((s, d) => s + (d.utilizedRacks || 0), 0);
  const uniqueCountries  = [...new Map(dataCenters.map(d => [d.countryId, { id: d.countryId, name: d.countryName }])).values()];

  const filteredDCs = dataCenters.filter(d => {
    const q = searchText.toLowerCase();
    const matchSearch  = !searchText || d.dataCenterName.toLowerCase().includes(q) || d.dataCenterCode.toLowerCase().includes(q) || d.locationName.toLowerCase().includes(q) || d.cityName.toLowerCase().includes(q) || d.countryName.toLowerCase().includes(q);
    const matchCountry = countryFilter === "all" || d.countryId === countryFilter;
    const matchStatus  = statusFilter  === "all" || d.status === statusFilter;
    return matchSearch && matchCountry && matchStatus;
  });

  // ── Validation ────────────────────────────────────────────────────────────
  const validators = {
    dataCenterName:  v => !v ? "Required" : v.length < 3 ? "Min 3 chars" : "",
    dataCenterCode:  v => !v ? "Required" : !/^[A-Z0-9-]+$/i.test(v) ? "Alphanumeric & hyphens only" : "",
    countryId:       v => !v ? "Select a country" : "",
    stateId:         v => !v ? "Select a state" : "",
    cityId:          v => !v ? "Select a city" : "",
    locationName:    v => !v ? "Required" : "",
    streetAddress:   v => !v ? "Required" : "",
    pinCode:         v => !v ? "Required" : "",
    siteId:          v => !v ? "Select a site" : "",
    tenantId:        v => !v ? "Select a tenant" : "",
    totalRacks:      v => (v === "" || v === null || v === undefined) ? "" : v < 0 ? "Must be ≥ 0" : "",
    utilizedRacks:   v => (v === "" || v === null || v === undefined) ? "" : v < 0 ? "Must be ≥ 0" : "",
    powerCapacity:   v => (v === "" || v === null || v === undefined) ? "" : v < 0 ? "Must be ≥ 0" : "",
    coolingCapacity: v => (v === "" || v === null || v === undefined) ? "" : v < 0 ? "Must be ≥ 0" : "",
    contactPersonId: v => !v ? "Select a contact person" : "",
    latitude:        v => !v ? "" : isNaN(v) || v < -90  || v > 90  ? "Range -90 to 90"   : "",
    longitude:       v => !v ? "" : isNaN(v) || v < -180 || v > 180 ? "Range -180 to 180" : "",
  };
  const validateAll = () => {
    const errs = Object.fromEntries(Object.keys(validators).map(k => [k, validators[k](formData[k])]));
    setFormErrors(prev => ({ ...prev, ...errs }));
    return Object.values(errs).every(e => !e);
  };
  const setErr = (field, val) => setFormErrors(prev => ({ ...prev, [field]: validators[field]?.(val) ?? "" }));

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleInputChange  = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); setErr(name, value); };
  const handleNumberChange = (name, value) => { setFormData(prev => ({ ...prev, [name]: value })); setErr(name, value); };

  const handleCountryChange = (v) => {
    setAvailableStates(statesList.filter(s => s.countryId === v));
    setAvailableCities([]); setAvailableSites([]);
    setFormData(prev => ({ ...prev, countryId: v, stateId: "", cityId: "", siteId: "" }));
    setFormErrors(prev => ({ ...prev, countryId: "", stateId: "", cityId: "", siteId: "" }));
  };
  const handleStateChange = (v) => {
    setAvailableCities(citiesList.filter(c => c.stateId === v));
    setAvailableSites([]);
    setFormData(prev => ({ ...prev, stateId: v, cityId: "", siteId: "" }));
    setFormErrors(prev => ({ ...prev, stateId: "", cityId: "", siteId: "" }));
  };
  const handleCityChange = (v) => {
    setAvailableSites(sitesList.filter(s => s.cityId === v));
    setFormData(prev => ({ ...prev, cityId: v, siteId: "" }));
    setFormErrors(prev => ({ ...prev, cityId: "", siteId: "" }));
  };
  const handleContactChange = (v) => {
    const u = usersList.find(x => x.id === v);
    setFormData(prev => ({ ...prev, contactPersonId: v, contactEmail: u?.email || "", contactPhone: u?.phone || "" }));
    setErr("contactPersonId", v);
  };

  const openAddModal = () => {
    setEditingDC(null); setFormData(emptyForm); setFormErrors(emptyErrors);
    setAvailableStates([]); setAvailableCities([]); setAvailableSites([]);
    setShowModal(true);
  };
  const openEditModal = (dc) => {
    setEditingDC(dc);
    setAvailableStates(statesList.filter(s => s.countryId === dc.countryId));
    setAvailableCities(citiesList.filter(c => c.stateId === dc.stateId));
    setAvailableSites(sitesList.filter(s => s.cityId === dc.cityId));
    setFormData({ dataCenterName: dc.dataCenterName, dataCenterCode: dc.dataCenterCode, countryId: dc.countryId, stateId: dc.stateId, cityId: dc.cityId, locationName: dc.locationName, streetAddress: dc.streetAddress, pinCode: dc.pinCode, latitude: dc.latitude, longitude: dc.longitude, siteId: dc.siteId, tenantId: dc.tenantId, totalRacks: dc.totalRacks, utilizedRacks: dc.utilizedRacks, powerCapacity: dc.powerCapacity, coolingCapacity: dc.coolingCapacity, contactPersonId: dc.contactPersonId, contactEmail: dc.contactEmail, contactPhone: dc.contactPhone, status: dc.status === "Active" });
    setFormErrors(emptyErrors);
    setShowModal(true);
  };
  const openDeleteModal  = (dc) => { setDcToDelete(dc); setShowDeleteModal(true); };
  const closeModal       = () => { setShowModal(false); setEditingDC(null); };
  const closeDeleteModal = () => { setShowDeleteModal(false); setDcToDelete(null); };

  const handleDelete = () => {
    if (dcToDelete) { setDataCenters(dataCenters.filter(d => d.id !== dcToDelete.id)); message.success("Data center deleted!"); closeDeleteModal(); }
  };

  const handleSubmit = () => {
    if (!validateAll()) { message.error("Please fix the errors in the form"); return; }
    setLoading(true);
    const country = countriesList.find(c => c.id === formData.countryId);
    const state   = statesList.find(s => s.id === formData.stateId);
    const city    = citiesList.find(c => c.id === formData.cityId);
    const site    = sitesList.find(s => s.id === formData.siteId);
    const tenant  = tenantsList.find(t => t.id === formData.tenantId);
    const contact = usersList.find(u => u.id === formData.contactPersonId);
    setTimeout(() => {
      const payload = { ...formData, dataCenterCode: formData.dataCenterCode.toUpperCase(), countryName: country?.name || "", stateName: state?.name || "", cityName: city?.name || "", siteName: site?.name || "", tenantName: tenant?.name || "", contactPersonName: contact?.name || "", totalRacks: parseInt(formData.totalRacks) || 0, utilizedRacks: parseInt(formData.utilizedRacks) || 0, powerCapacity: parseInt(formData.powerCapacity) || 0, coolingCapacity: parseInt(formData.coolingCapacity) || 0, status: formData.status ? "Active" : "Inactive" };
      if (editingDC) {
        setDataCenters(dataCenters.map(d => d.id === editingDC.id ? { ...d, ...payload } : d));
        message.success("Data center updated!");
      } else {
        setDataCenters([...dataCenters, { id: Date.now(), ...payload, createdDate: new Date().toISOString().split("T")[0] }]);
        message.success("Data center added!");
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
        <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
      </div>
    </div>
  );

  // ── Shared style tokens ───────────────────────────────────────────────────
  const backdropStyle  = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000 };
  const modalBoxStyle  = (w) => ({ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", backgroundColor: "white", padding: "20px", borderRadius: "8px", width: w, maxWidth: "95%", maxHeight: "92vh", overflowY: "auto", zIndex: 1001, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" });
  const lbl            = { display: "block", marginBottom: 4, fontWeight: 500, fontSize: 13 };
  const errText        = (msg) => msg ? <Text type="danger" style={{ fontSize: 11, marginTop: 2, display: "block" }}>{msg}</Text> : null;
  const inputStyle     = { width: "100%", padding: "5px 10px", border: "1px solid #d9d9d9", borderRadius: 6, fontSize: 13, boxSizing: "border-box", outline: "none", fontFamily: "inherit" };

  const statusBadge = (s) => {
    const map = { Active: "success", Maintenance: "warning", Warning: "error", Inactive: "default" };
    return <Badge status={map[s] || "default"} text={<span style={{ fontSize: 11 }}>{s}</span>} />;
  };
  const dcAvatarColor = (s) => s === "Active" ? "#1890ff" : s === "Warning" ? "#faad14" : s === "Maintenance" ? "#722ed1" : "#d9d9d9";
  const utilPct = (used, total) => total ? Math.round((used / total) * 100) : 0;

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 48,
      sorter: (a, b) => a.id - b.id, sortOrder: sortedInfo.columnKey === "id" && sortedInfo.order,
      render: t => <Text style={{ fontSize: 11 }}>{t}</Text> },
    { title: "Data Center", key: "dc", width: 160, ellipsis: true,
      sorter: (a, b) => a.dataCenterName.localeCompare(b.dataCenterName),
      render: (_, r) => (
        <Space size={4}>
          <Avatar icon={<CloudServerOutlined />} style={{ backgroundColor: dcAvatarColor(r.status), flexShrink: 0 }} size={20} />
          <div>
            <Text strong style={{ fontSize: 11 }}>{r.dataCenterName}</Text>
            <div><Text type="secondary" style={{ fontSize: 10 }}>{r.dataCenterCode}</Text></div>
          </div>
        </Space>
      ) },
    { title: "Location", key: "location", width: 160, ellipsis: true,
      sorter: (a, b) => a.locationName.localeCompare(b.locationName),
      render: (_, r) => (
        <div>
          <Space size={4}><EnvironmentOutlined style={{ color: "#1890ff", fontSize: 10 }} /><Text strong style={{ fontSize: 11 }}>{r.locationName}</Text></Space>
          <div><Text type="secondary" style={{ fontSize: 10 }}>{r.cityName}, {r.countryName}</Text></div>
          <div><Text type="secondary" style={{ fontSize: 10 }}>Site: {r.siteName} · {r.tenantName}</Text></div>
        </div>
      ) },
    { title: "Racks", key: "racks", width: 110,
      sorter: (a, b) => utilPct(a.utilizedRacks, a.totalRacks) - utilPct(b.utilizedRacks, b.totalRacks),
      render: (_, r) => {
        const pct = utilPct(r.utilizedRacks, r.totalRacks);
        return (
          <Tooltip title={`${r.utilizedRacks}/${r.totalRacks} racks`}>
            <div>
              <Text style={{ fontSize: 10 }}>{r.utilizedRacks}/{r.totalRacks}</Text>
              <Progress percent={pct} size="small" showInfo={false}
                status={pct > 90 ? "exception" : pct > 70 ? "active" : "normal"} />
            </div>
          </Tooltip>
        );
      } },
    { title: "Power / Cooling", key: "specs", width: 120,
      render: (_, r) => (
        <div>
          <Space size={4}><ThunderboltOutlined style={{ color: "#fa8c16", fontSize: 10 }} /><Text style={{ fontSize: 10 }}>{r.powerCapacity} kW</Text></Space>
          <div><Space size={4}><HeatMapOutlined style={{ color: "#13c2c2", fontSize: 10 }} /><Text style={{ fontSize: 10 }}>{r.coolingCapacity} TR</Text></Space></div>
        </div>
      ) },
    { title: "Contact", key: "contact", width: 155, ellipsis: true,
      render: (_, r) => (
        <div>
          <Space size={4}><UserOutlined style={{ color: "#1890ff", fontSize: 10 }} /><Text style={{ fontSize: 11 }}>{r.contactPersonName}</Text></Space>
          <div><Space size={4}><MailOutlined style={{ color: "#722ed1", fontSize: 10 }} /><Text style={{ fontSize: 10 }}>{r.contactEmail}</Text></Space></div>
        </div>
      ) },
    { title: "Created", dataIndex: "createdDate", key: "createdDate", width: 88,
      sorter: (a, b) => new Date(a.createdDate) - new Date(b.createdDate),
      render: t => <Text style={{ fontSize: 10 }}>{t}</Text> },
    { title: "Status", dataIndex: "status", key: "status", width: 100,
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: t => statusBadge(t),
      filters: ["Active","Maintenance","Warning","Inactive"].map(v => ({ text: v, value: v })),
      onFilter: (v, r) => r.status === v },
    { title: "", key: "actions", width: 72, fixed: "right",
      render: (_, r) => (
        <Space size={0}>
          <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditModal(r)} style={{ color: "#1890ff", padding: "0 3px" }} /></Tooltip>
          <Tooltip title="Delete"><Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => openDeleteModal(r)} style={{ color: "#ff4d4f", padding: "0 3px" }} /></Tooltip>
        </Space>
      ) },
  ];

  // ── Select helper ─────────────────────────────────────────────────────────
  const fldSelect = (field, label, opts, required, placeholder, disabled, hint) => (
    <div>
      <label style={lbl}>{label}{required && <span style={{ color: "#ff4d4f" }}> *</span>}</label>
      <Select value={formData[field] || undefined} onChange={v => { setFormData(prev => ({ ...prev, [field]: v })); setErr(field, v); }}
        size="small" style={{ width: "100%" }} placeholder={placeholder} showSearch optionFilterProp="children"
        disabled={disabled} status={formErrors[field] ? "error" : ""}>
        {opts.map(o => <Option key={o.id} value={o.id}>{o.label || o.name}</Option>)}
      </Select>
      {errText(formErrors[field])}
      {disabled && hint && !formErrors[field] && <Text type="secondary" style={{ fontSize: 11 }}>{hint}</Text>}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f0f2f5", padding: "10px 16px", boxSizing: "border-box", overflow: "hidden" }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexShrink: 0 }}>
        <div>
          <Title level={4} style={{ margin: 0, lineHeight: 1.3 }}>
            <CloudServerOutlined style={{ marginRight: 8, color: "#1890ff" }} />
            Data Center Management
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>Manage data center facilities and infrastructure</Text>
        </div>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal} size="small"
            style={{ background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)", border: "none" }}>
            Add Data Center
          </Button>
          <Button icon={<ReloadOutlined />} size="small" onClick={() => window.location.reload()}>Refresh</Button>
        </Space>
      </div>

      {/* ── STAT CARDS ── */}
      <Row gutter={10} style={{ marginBottom: 8, flexShrink: 0 }}>
        <Col span={4}><StatCard label="Total DCs"    value={totalCount}       color="#1890ff" icon={<CloudServerOutlined style={{ color: "#1890ff" }} />} /></Col>
        <Col span={4}><StatCard label="Active"       value={activeCount}      color="#52c41a" icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />} /></Col>
        <Col span={4}><StatCard label="Maintenance"  value={maintenanceCount} color="#722ed1" icon={<ApiOutlined         style={{ color: "#722ed1" }} />} /></Col>
        <Col span={4}><StatCard label="Warning"      value={warningCount}     color="#faad14" icon={<ExclamationCircleOutlined style={{ color: "#faad14" }} />} /></Col>
        <Col span={8}><StatCard label="Rack Utilization" value={`${totalRacksUsed} / ${totalRacksCap}`} color="#13c2c2" icon={<DashboardOutlined style={{ color: "#13c2c2" }} />} /></Col>
      </Row>

      {/* ── FILTERS ── */}
      <div style={{ backgroundColor: "white", borderRadius: 6, padding: "8px 12px", marginBottom: 8, flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={24} md={10} lg={10}>
            <Input placeholder="Search by name, code, location, city..." prefix={<SearchOutlined style={{ color: "#bbb" }} />}
              value={searchText} onChange={e => setSearchText(e.target.value)} allowClear size="small" />
          </Col>
          <Col xs={8} sm={6} md={5} lg={5}>
            <Select value={countryFilter} onChange={setCountryFilter} size="small" style={{ width: "100%" }}>
              <Option value="all">All Countries</Option>
              {uniqueCountries.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
            </Select>
          </Col>
          <Col xs={8} sm={6} md={4} lg={4}>
            <Select value={statusFilter} onChange={setStatusFilter} size="small" style={{ width: "100%" }}>
              <Option value="all">All Status</Option>
              {["Active","Maintenance","Warning","Inactive"].map(s => <Option key={s} value={s}>{s}</Option>)}
            </Select>
          </Col>
          <Col xs={0} sm={0} md={5} lg={5} style={{ textAlign: "right" }}>
            <Text style={{ fontSize: 12, color: "#888", whiteSpace: "nowrap" }}>{filteredDCs.length} / {totalCount} shown</Text>
          </Col>
        </Row>
      </div>

      {/* ── TABLE ── */}
      <div style={{ flex: 1, backgroundColor: "white", borderRadius: 6, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ padding: "7px 14px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <Text strong style={{ fontSize: 13 }}>Data Centers List</Text>
          <Badge count={filteredDCs.length} style={{ backgroundColor: "#1890ff" }} />
        </div>
        <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
          <Table
            columns={columns} dataSource={filteredDCs} loading={loading}
            bordered={false} rowKey="id" size="small" scroll={{ x: "max-content" }}
            pagination={{ pageSize: 8, showSizeChanger: false, showTotal: total => `${total} data centers`, size: "small", style: { padding: "5px 14px", margin: 0 } }}
            onChange={handleTableChange} style={{ fontSize: 12 }}
            locale={{ emptyText: <div style={{ padding: "12px 0", textAlign: "center", color: "#999", fontSize: 13 }}>No data found</div> }}
          />
        </div>
      </div>


      {/* ══ ADD / EDIT MODAL ══ */}
      {showModal && (
        <>
          <div style={backdropStyle} onClick={closeModal} />
          <div style={modalBoxStyle("900px")}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: "#1890ff", fontSize: 15 }}>{editingDC ? "Edit Data Center" : "Add New Data Center"}</h3>
              <Button type="text" icon={<CloseOutlined />} onClick={closeModal} style={{ color: "#666" }} />
            </div>

            <Divider style={{ margin: "0 0 12px" }}>
              <Space size={4}><GlobalOutlined style={{ color: "#1890ff" }} /><Text style={{ fontSize: 12 }} strong>Location Hierarchy</Text></Space>
            </Divider>

            {/* Row 1 — Country + State */}
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={12}>{fldSelect("countryId", "Country", countriesList.map(c => ({ ...c, label: `${c.name} (${c.code})` })), true, "Select country", false, "")}</Col>
              <Col span={12}>{fldSelect("stateId", "State", availableStates.map(s => ({ ...s, label: `${s.name} (${s.code})` })), true, "Select state", !formData.countryId, "Select a country first")}</Col>
            </Row>

            {/* Row 2 — City + Site */}
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={12}>{fldSelect("cityId", "City", availableCities.map(c => ({ ...c, label: `${c.name} (${c.code})` })), true, "Select city", !formData.stateId, "Select a state first")}</Col>
              <Col span={12}>{fldSelect("siteId", "Site", availableSites.map(s => ({ ...s, label: `${s.name} (${s.code})` })), true, "Select site", !formData.cityId, "Select a city first")}</Col>
            </Row>

            <Divider style={{ margin: "4px 0 12px" }}>
              <Space size={4}><CloudServerOutlined style={{ color: "#1890ff" }} /><Text style={{ fontSize: 12 }} strong>Basic Information</Text></Space>
            </Divider>

            {/* Row 3 — Tenant (full width) */}
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={24}>{fldSelect("tenantId", "Tenant", tenantsList.map(t => ({ ...t, label: `${t.name} (${t.code}) — ${t.type}` })), true, "Select tenant", false, "")}</Col>
            </Row>

            {/* Row 4 — DC Name + DC Code */}
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={12}>
                <label style={lbl}>Data Center Name <span style={{ color: "#ff4d4f" }}>*</span></label>
                <input name="dataCenterName" value={formData.dataCenterName} onChange={handleInputChange}
                  style={{ ...inputStyle, borderColor: formErrors.dataCenterName ? "#ff4d4f" : "#d9d9d9" }}
                  placeholder="e.g., LAX1 - Main Facility"
                  onFocus={e => e.target.style.borderColor="#1890ff"} onBlur={e => e.target.style.borderColor=formErrors.dataCenterName?"#ff4d4f":"#d9d9d9"} />
                {errText(formErrors.dataCenterName)}
              </Col>
              <Col span={12}>
                <label style={lbl}>Data Center Code <span style={{ color: "#ff4d4f" }}>*</span></label>
                <input name="dataCenterCode" value={formData.dataCenterCode} onChange={handleInputChange}
                  style={{ ...inputStyle, textTransform: "uppercase", borderColor: formErrors.dataCenterCode ? "#ff4d4f" : "#d9d9d9" }}
                  placeholder="e.g., LAX-MAIN-01"
                  onFocus={e => e.target.style.borderColor="#1890ff"} onBlur={e => e.target.style.borderColor=formErrors.dataCenterCode?"#ff4d4f":"#d9d9d9"} />
                {errText(formErrors.dataCenterCode)}
              </Col>
            </Row>

            <Divider style={{ margin: "4px 0 12px" }}>
              <Space size={4}><EnvironmentOutlined style={{ color: "#ff4d4f" }} /><Text style={{ fontSize: 12 }} strong>Location Details</Text></Space>
            </Divider>

            {/* Row 5 — Location Name (full width) */}
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={24}>
                <label style={lbl}>Location Name <span style={{ color: "#ff4d4f" }}>*</span></label>
                <input name="locationName" value={formData.locationName} onChange={handleInputChange}
                  style={{ ...inputStyle, borderColor: formErrors.locationName ? "#ff4d4f" : "#d9d9d9" }}
                  placeholder="e.g., Main Data Center"
                  onFocus={e => e.target.style.borderColor="#1890ff"} onBlur={e => e.target.style.borderColor=formErrors.locationName?"#ff4d4f":"#d9d9d9"} />
                {errText(formErrors.locationName)}
              </Col>
            </Row>

            {/* Row 6 — Street Address + PIN Code */}
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={16}>
                <label style={lbl}>Street Address <span style={{ color: "#ff4d4f" }}>*</span></label>
                <input name="streetAddress" value={formData.streetAddress} onChange={handleInputChange}
                  style={{ ...inputStyle, borderColor: formErrors.streetAddress ? "#ff4d4f" : "#d9d9d9" }}
                  placeholder="e.g., 123 Main Street"
                  onFocus={e => e.target.style.borderColor="#1890ff"} onBlur={e => e.target.style.borderColor=formErrors.streetAddress?"#ff4d4f":"#d9d9d9"} />
                {errText(formErrors.streetAddress)}
              </Col>
              <Col span={8}>
                <label style={lbl}>PIN Code <span style={{ color: "#ff4d4f" }}>*</span></label>
                <input name="pinCode" value={formData.pinCode} onChange={handleInputChange}
                  style={{ ...inputStyle, borderColor: formErrors.pinCode ? "#ff4d4f" : "#d9d9d9" }}
                  placeholder="e.g., 94105"
                  onFocus={e => e.target.style.borderColor="#1890ff"} onBlur={e => e.target.style.borderColor=formErrors.pinCode?"#ff4d4f":"#d9d9d9"} />
                {errText(formErrors.pinCode)}
              </Col>
            </Row>

            {/* Row 7 — Latitude + Longitude */}
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={12}>
                <label style={lbl}>Latitude <Text type="secondary" style={{ fontSize: 11 }}>(optional)</Text></label>
                <input name="latitude" value={formData.latitude} onChange={handleInputChange}
                  style={{ ...inputStyle, borderColor: formErrors.latitude ? "#ff4d4f" : "#d9d9d9" }}
                  placeholder="Range: -90 to 90"
                  onFocus={e => e.target.style.borderColor="#1890ff"} onBlur={e => e.target.style.borderColor=formErrors.latitude?"#ff4d4f":"#d9d9d9"} />
                {errText(formErrors.latitude)}
              </Col>
              <Col span={12}>
                <label style={lbl}>Longitude <Text type="secondary" style={{ fontSize: 11 }}>(optional)</Text></label>
                <input name="longitude" value={formData.longitude} onChange={handleInputChange}
                  style={{ ...inputStyle, borderColor: formErrors.longitude ? "#ff4d4f" : "#d9d9d9" }}
                  placeholder="Range: -180 to 180"
                  onFocus={e => e.target.style.borderColor="#1890ff"} onBlur={e => e.target.style.borderColor=formErrors.longitude?"#ff4d4f":"#d9d9d9"} />
                {errText(formErrors.longitude)}
              </Col>
            </Row>

            <Divider style={{ margin: "4px 0 12px" }}>
              <Space size={4}><DashboardOutlined style={{ color: "#13c2c2" }} /><Text style={{ fontSize: 12 }} strong>Technical Specifications</Text></Space>
            </Divider>

            {/* Row 8 — Total Racks + Utilized Racks + Power + Cooling */}
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={6}>
                <label style={lbl}>Total Racks</label>
                <InputNumber value={formData.totalRacks} onChange={v => handleNumberChange("totalRacks", v)} size="small" style={{ width: "100%" }} placeholder="e.g., 500" min={0} max={10000} status={formErrors.totalRacks ? "error" : ""} />
                {errText(formErrors.totalRacks)}
              </Col>
              <Col span={6}>
                <label style={lbl}>Utilized Racks</label>
                <InputNumber value={formData.utilizedRacks} onChange={v => handleNumberChange("utilizedRacks", v)} size="small" style={{ width: "100%" }} placeholder="e.g., 325" min={0} max={formData.totalRacks || 10000} status={formErrors.utilizedRacks ? "error" : ""} />
                {errText(formErrors.utilizedRacks)}
              </Col>
              <Col span={6}>
                <label style={lbl}>Power Capacity (kW)</label>
                <InputNumber value={formData.powerCapacity} onChange={v => handleNumberChange("powerCapacity", v)} size="small" style={{ width: "100%" }} placeholder="e.g., 2500" min={0} max={10000} status={formErrors.powerCapacity ? "error" : ""} />
                {errText(formErrors.powerCapacity)}
              </Col>
              <Col span={6}>
                <label style={lbl}>Cooling Capacity (TR)</label>
                <InputNumber value={formData.coolingCapacity} onChange={v => handleNumberChange("coolingCapacity", v)} size="small" style={{ width: "100%" }} placeholder="e.g., 750" min={0} max={5000} status={formErrors.coolingCapacity ? "error" : ""} />
                {errText(formErrors.coolingCapacity)}
              </Col>
            </Row>

            <Divider style={{ margin: "4px 0 12px" }}>
              <Space size={4}><UserOutlined style={{ color: "#1890ff" }} /><Text style={{ fontSize: 12 }} strong>Contact Information</Text></Space>
            </Divider>

            {/* Row 9 — Contact Person */}
            <Row gutter={12} style={{ marginBottom: formData.contactPersonId ? 8 : 14 }}>
              <Col span={24}>
                <label style={lbl}>Contact Person <span style={{ color: "#ff4d4f" }}>*</span></label>
                <Select value={formData.contactPersonId || undefined} onChange={handleContactChange}
                  size="small" style={{ width: "100%" }} placeholder="Select contact person" showSearch optionFilterProp="children"
                  status={formErrors.contactPersonId ? "error" : ""}>
                  {usersList.map(u => (
                    <Option key={u.id} value={u.id}>
                      <Space size={4}><UserOutlined style={{ color: "#1890ff" }} /><Text strong>{u.name}</Text><Text type="secondary" style={{ fontSize: 11 }}>({u.role})</Text></Space>
                    </Option>
                  ))}
                </Select>
                {errText(formErrors.contactPersonId)}
              </Col>
            </Row>

            {formData.contactPersonId && (
              <div style={{ backgroundColor: "#f5f5f5", padding: "10px 14px", borderRadius: 4, marginBottom: 14 }}>
                <Row gutter={16}>
                  <Col span={12}><Space size={4}><MailOutlined style={{ color: "#722ed1" }} /><Text style={{ fontSize: 12 }}>{formData.contactEmail}</Text></Space></Col>
                  <Col span={12}><Space size={4}><PhoneOutlined style={{ color: "#52c41a" }} /><Text style={{ fontSize: 12 }}>{formData.contactPhone}</Text></Space></Col>
                </Row>
              </div>
            )}

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
              <Button type="primary" loading={loading} onClick={handleSubmit} icon={editingDC ? <EditOutlined /> : <PlusOutlined />}>
                {loading ? "Saving..." : editingDC ? "Update Data Center" : "Create Data Center"}
              </Button>
            </div>
          </div>
        </>
      )}


      {/* ══ DELETE MODAL ══ */}
      {showDeleteModal && dcToDelete && (
        <>
          <div style={backdropStyle} onClick={closeDeleteModal} />
          <div style={{ ...modalBoxStyle("480px"), textAlign: "center" }}>
            <ExclamationCircleOutlined style={{ fontSize: 40, color: "#ff4d4f", marginBottom: 10 }} />
            <h3 style={{ color: "#ff4d4f", marginBottom: 6 }}>Delete Data Center</h3>
            <p style={{ fontSize: 14, marginBottom: 10 }}>Are you sure you want to delete this data center?</p>
            <div style={{ backgroundColor: "#f5f5f5", padding: 12, borderRadius: 4, marginBottom: 12, textAlign: "left", fontSize: 13 }}>
              {[
                ["Name",        dcToDelete.dataCenterName],
                ["Code",        dcToDelete.dataCenterCode],
                ["Tenant",      dcToDelete.tenantName],
                ["Location",    dcToDelete.locationName],
                ["Address",     `${dcToDelete.streetAddress}, ${dcToDelete.cityName}, ${dcToDelete.countryName}`],
                ["Racks",       `${dcToDelete.utilizedRacks} / ${dcToDelete.totalRacks}`],
                ["Power",       `${dcToDelete.powerCapacity} kW`],
                ["Cooling",     `${dcToDelete.coolingCapacity} TR`],
                ["Contact",     dcToDelete.contactPersonName],
                ["Status",      dcToDelete.status],
              ].map(([k, v]) => <p key={k} style={{ margin: "3px 0" }}><strong>{k}:</strong> {v}</p>)}
            </div>
            <p style={{ color: "#ff7875", fontSize: 12, marginBottom: 16 }}>This action cannot be undone.</p>
            <Space>
              <Button onClick={closeDeleteModal}>Cancel</Button>
              <Button danger type="primary" onClick={handleDelete} icon={<DeleteOutlined />}>Delete Data Center</Button>
            </Space>
          </div>
        </>
      )}

    </div>
  );
};

export default AddDataCenter;