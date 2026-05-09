// AddRole.jsx
import React, { useState } from "react";
import {
  Table, Row, Col, Typography, Space, Button, Select,
  message, Input, Switch, Divider, Avatar, Tooltip, Badge, Tag
} from "antd";
import {
  SafetyOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
  CheckCircleOutlined, StopOutlined, PlusOutlined, SearchOutlined,
  ExclamationCircleOutlined, CloseOutlined, LockOutlined,
  TeamOutlined, KeyOutlined
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

const AddRole = () => {
  const [loading, setLoading]               = useState(false);
  const [showModal, setShowModal]           = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roleToDelete, setRoleToDelete]     = useState(null);
  const [editingRole, setEditingRole]       = useState(null);
  const [sortedInfo, setSortedInfo]         = useState({ columnKey: "id", order: "ascend" });
  const [searchText, setSearchText]         = useState("");
  const [typeFilter, setTypeFilter]         = useState("all");
  const [statusFilter, setStatusFilter]     = useState("all");

  const emptyForm = { roleName: "", roleKey: "", roleType: "", description: "", permissionLevel: "read_only", status: true };
  const emptyErrors = { roleName: "", roleKey: "", roleType: "" };

  const [formData, setFormData]     = useState(emptyForm);
  const [formErrors, setFormErrors] = useState(emptyErrors);

  const roleTypes = [
    { value: "system",      label: "System",      color: "#f5222d" },
    { value: "operational", label: "Operational", color: "#1890ff" },
    { value: "management",  label: "Management",  color: "#722ed1" },
    { value: "support",     label: "Support",     color: "#fa8c16" },
    { value: "external",    label: "External",    color: "#13c2c2" },
  ];

  const permissionLevels = [
    { value: "full_access", label: "Full Access", color: "#52c41a" },
    { value: "read_write",  label: "Read & Write", color: "#1890ff" },
    { value: "read_only",   label: "Read Only",   color: "#faad14" },
    { value: "no_access",   label: "No Access",   color: "#ff4d4f" },
  ];

  const [roles, setRoles] = useState([
    { id: 1, roleName: "Super Admin",   roleKey: "super_admin",   roleType: "system",      description: "Full system access with all privileges",           permissionLevel: "full_access", userCount: 2,  status: "Active",   createdDate: "2024-01-10" },
    { id: 2, roleName: "Admin",         roleKey: "admin",         roleType: "system",      description: "Administrative access to manage platform settings", permissionLevel: "full_access", userCount: 5,  status: "Active",   createdDate: "2024-01-15" },
    { id: 3, roleName: "Manager",       roleKey: "manager",       roleType: "management",  description: "Team and resource management capabilities",          permissionLevel: "read_write",  userCount: 12, status: "Active",   createdDate: "2024-02-01" },
    { id: 4, roleName: "Supervisor",    roleKey: "supervisor",    roleType: "operational", description: "Supervise daily operations and teams",               permissionLevel: "read_write",  userCount: 8,  status: "Active",   createdDate: "2024-02-15" },
    { id: 5, roleName: "User",          roleKey: "user",          roleType: "operational", description: "Standard user access for day-to-day tasks",          permissionLevel: "read_write",  userCount: 45, status: "Active",   createdDate: "2024-03-01" },
    { id: 6, roleName: "Viewer",        roleKey: "viewer",        roleType: "support",     description: "Read-only access to view reports and dashboards",    permissionLevel: "read_only",   userCount: 20, status: "Active",   createdDate: "2024-03-10" },
    { id: 7, roleName: "Auditor",       roleKey: "auditor",       roleType: "external",    description: "Access for audit and compliance review",             permissionLevel: "read_only",   userCount: 3,  status: "Active",   createdDate: "2024-04-01" },
    { id: 8, roleName: "Contractor",    roleKey: "contractor",    roleType: "external",    description: "Limited access for external contractors",            permissionLevel: "read_only",   userCount: 6,  status: "Inactive", createdDate: "2024-04-20" },
  ]);

  // ── Computed ──────────────────────────────────────────────────────────────
  const totalCount    = roles.length;
  const activeCount   = roles.filter(r => r.status === "Active").length;
  const inactiveCount = roles.filter(r => r.status !== "Active").length;

  const filteredRoles = roles.filter(r => {
    const q = searchText.toLowerCase();
    const matchSearch  = !searchText || r.roleName.toLowerCase().includes(q) || r.roleKey.toLowerCase().includes(q) || (r.description||"").toLowerCase().includes(q);
    const matchType    = typeFilter   === "all" || r.roleType === typeFilter;
    const matchStatus  = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  // ── Validation ────────────────────────────────────────────────────────────
  const validators = {
    roleName: v => !v ? "Role name is required" : v.length < 2 ? "Min 2 characters" : "",
    roleKey:  v => !v ? "Role key is required" : !/^[a-z0-9_]+$/.test(v) ? "Lowercase letters, numbers and underscores only" : "",
    roleType: v => !v ? "Select a role type" : "",
  };
  const validateAll = () => {
    const errs = Object.fromEntries(Object.keys(validators).map(k => [k, validators[k](formData[k])]));
    setFormErrors(errs);
    return Object.values(errs).every(e => !e);
  };
  const setErr = (field, val) => setFormErrors(prev => ({ ...prev, [field]: validators[field]?.(val) ?? "" }));

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const v = name === "roleKey" ? value.toLowerCase().replace(/[^a-z0-9_]/g, "") : value;
    setFormData(prev => ({ ...prev, [name]: v }));
    setErr(name, v);
  };

  const openAddModal = () => {
    setEditingRole(null); setFormData(emptyForm); setFormErrors(emptyErrors); setShowModal(true);
  };
  const openEditModal = (r) => {
    setEditingRole(r);
    setFormData({ roleName: r.roleName, roleKey: r.roleKey, roleType: r.roleType, description: r.description || "", permissionLevel: r.permissionLevel, status: r.status === "Active" });
    setFormErrors(emptyErrors);
    setShowModal(true);
  };
  const openDeleteModal  = (r) => { setRoleToDelete(r); setShowDeleteModal(true); };
  const closeModal       = () => { setShowModal(false); setEditingRole(null); };
  const closeDeleteModal = () => { setShowDeleteModal(false); setRoleToDelete(null); };

  const handleDelete = () => {
    if (roleToDelete) { setRoles(roles.filter(r => r.id !== roleToDelete.id)); message.success("Role deleted!"); closeDeleteModal(); }
  };

  const handleSubmit = () => {
    if (!validateAll()) { message.error("Please fix the errors in the form"); return; }
    setLoading(true);
    setTimeout(() => {
      if (editingRole) {
        setRoles(roles.map(r => r.id === editingRole.id ? { ...r, roleName: formData.roleName, roleKey: formData.roleKey, roleType: formData.roleType, description: formData.description, permissionLevel: formData.permissionLevel, status: formData.status ? "Active" : "Inactive" } : r));
        message.success("Role updated!");
      } else {
        setRoles([...roles, { id: Date.now(), roleName: formData.roleName, roleKey: formData.roleKey, roleType: formData.roleType, description: formData.description, permissionLevel: formData.permissionLevel, userCount: 0, status: formData.status ? "Active" : "Inactive", createdDate: new Date().toISOString().split("T")[0] }]);
        message.success("Role created!");
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
  const modalBoxStyle = (w) => ({ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", backgroundColor: "white", padding: "20px", borderRadius: "8px", width: w, maxWidth: "95%", maxHeight: "92vh", overflowY: "auto", zIndex: 1001, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" });
  const lbl     = { display: "block", marginBottom: 4, fontWeight: 500, fontSize: 13 };
  const errText = (msg) => msg ? <Text type="danger" style={{ fontSize: 11, marginTop: 2, display: "block" }}>{msg}</Text> : null;
  const inputStyle = { width: "100%", padding: "5px 10px", border: "1px solid #d9d9d9", borderRadius: 6, fontSize: 13, boxSizing: "border-box", outline: "none", fontFamily: "inherit" };

  const getRoleTypeColor = (type) => roleTypes.find(t => t.value === type)?.color || "#1890ff";
  const getPermColor     = (perm) => permissionLevels.find(p => p.value === perm)?.color || "#1890ff";
  const getPermLabel     = (perm) => permissionLevels.find(p => p.value === perm)?.label || perm;

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 52,
      sorter: (a, b) => a.id - b.id, sortOrder: sortedInfo.columnKey === "id" && sortedInfo.order,
      render: t => <Text style={{ fontSize: 11 }}>{t}</Text> },
    { title: "Role", key: "role", width: 170,
      sorter: (a, b) => a.roleName.localeCompare(b.roleName), sortOrder: sortedInfo.columnKey === "role" && sortedInfo.order,
      render: (_, r) => (
        <Space size={4}>
          <Avatar icon={<SafetyOutlined />} style={{ backgroundColor: getRoleTypeColor(r.roleType), flexShrink: 0 }} size={20} />
          <div>
            <Text strong style={{ fontSize: 11 }}>{r.roleName}</Text>
            <div><Text type="secondary" style={{ fontSize: 10, fontFamily: "monospace" }}>{r.roleKey}</Text></div>
          </div>
        </Space>
      ) },
    { title: "Type", dataIndex: "roleType", key: "roleType", width: 110,
      sorter: (a, b) => a.roleType.localeCompare(b.roleType),
      render: t => <Tag color={getRoleTypeColor(t)} style={{ fontSize: 10 }}>{roleTypes.find(x => x.value === t)?.label || t}</Tag>,
      filters: roleTypes.map(t => ({ text: t.label, value: t.value })),
      onFilter: (v, r) => r.roleType === v },
    { title: "Permission", dataIndex: "permissionLevel", key: "permissionLevel", width: 115,
      render: t => <Tag color={getPermColor(t)} style={{ fontSize: 10 }}>{getPermLabel(t)}</Tag> },
    { title: "Description", dataIndex: "description", key: "description", ellipsis: true,
      render: t => <Text type="secondary" style={{ fontSize: 11 }}>{t || "—"}</Text> },
    { title: "Users", dataIndex: "userCount", key: "userCount", width: 68,
      sorter: (a, b) => a.userCount - b.userCount,
      render: t => <Badge count={t} style={{ backgroundColor: "#1890ff" }} overflowCount={999} /> },
    { title: "Created", dataIndex: "createdDate", key: "createdDate", width: 95,
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
            <SafetyOutlined style={{ marginRight: 8, color: "#1890ff" }} />
            Role Management
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>Create and manage roles and their permissions</Text>
        </div>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal} size="small"
            style={{ background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)", border: "none" }}>
            Create Role
          </Button>
          <Button icon={<ReloadOutlined />} size="small" onClick={() => window.location.reload()}>Refresh</Button>
        </Space>
      </div>

      {/* ── STAT CARDS ── */}
      <Row gutter={10} style={{ marginBottom: 8, flexShrink: 0 }}>
        <Col span={6}><StatCard label="Total Roles"   value={totalCount}    color="#1890ff" icon={<SafetyOutlined       style={{ color: "#1890ff" }} />} /></Col>
        <Col span={6}><StatCard label="Active"        value={activeCount}   color="#52c41a" icon={<CheckCircleOutlined  style={{ color: "#52c41a" }} />} /></Col>
        <Col span={6}><StatCard label="Inactive"      value={inactiveCount} color="#8c8c8c" icon={<StopOutlined         style={{ color: "#8c8c8c" }} />} /></Col>
        <Col span={6}><StatCard label="Role Types"    value={roleTypes.length} color="#722ed1" icon={<KeyOutlined       style={{ color: "#722ed1" }} />} /></Col>
      </Row>

      {/* ── FILTERS ── */}
      <div style={{ backgroundColor: "white", borderRadius: 6, padding: "8px 12px", marginBottom: 8, flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={24} md={10} lg={10}>
            <Input placeholder="Search by name, key or description..." prefix={<SearchOutlined style={{ color: "#bbb" }} />}
              value={searchText} onChange={e => setSearchText(e.target.value)} allowClear size="small" />
          </Col>
          <Col xs={8} sm={6} md={5} lg={5}>
            <Select value={typeFilter} onChange={setTypeFilter} size="small" style={{ width: "100%" }}>
              <Option value="all">All Types</Option>
              {roleTypes.map(t => <Option key={t.value} value={t.value}>{t.label}</Option>)}
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
            <Text style={{ fontSize: 12, color: "#888", whiteSpace: "nowrap" }}>{filteredRoles.length} / {totalCount} shown</Text>
          </Col>
        </Row>
      </div>

      {/* ── TABLE ── */}
      <div style={{ flex: 1, backgroundColor: "white", borderRadius: 6, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ padding: "7px 14px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <Text strong style={{ fontSize: 13 }}>Roles List</Text>
          <Badge count={filteredRoles.length} style={{ backgroundColor: "#1890ff" }} />
        </div>
        <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
          <Table
            columns={columns} dataSource={filteredRoles} loading={loading}
            bordered={false} rowKey="id" size="small" scroll={{ x: "max-content" }}
            pagination={{ pageSize: 8, showSizeChanger: false, showTotal: total => `${total} roles`, size: "small", style: { padding: "5px 14px", margin: 0 } }}
            onChange={handleTableChange} style={{ fontSize: 12 }}
            locale={{ emptyText: <div style={{ padding: "12px 0", textAlign: "center", color: "#999", fontSize: 13 }}>No data found</div> }}
          />
        </div>
      </div>



      {/* ══ ADD / EDIT MODAL ══ */}
      {showModal && (
        <>
          <div style={backdropStyle} onClick={closeModal} />
          <div style={modalBoxStyle("560px")}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: "#1890ff", fontSize: 15 }}>{editingRole ? "Edit Role" : "Create New Role"}</h3>
              <Button type="text" icon={<CloseOutlined />} onClick={closeModal} style={{ color: "#666" }} />
            </div>

            {/* Row 1 — Role Name + Role Key */}
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={12}>
                <label style={lbl}>Role Name <span style={{ color: "#ff4d4f" }}>*</span></label>
                <input name="roleName" value={formData.roleName} onChange={handleInputChange}
                  style={{ ...inputStyle, borderColor: formErrors.roleName ? "#ff4d4f" : "#d9d9d9" }}
                  placeholder="e.g., Admin"
                  onFocus={e => e.target.style.borderColor = "#1890ff"} onBlur={e => e.target.style.borderColor = formErrors.roleName ? "#ff4d4f" : "#d9d9d9"} />
                {errText(formErrors.roleName)}
              </Col>
              <Col span={12}>
                <label style={lbl}>Role Key <span style={{ color: "#ff4d4f" }}>*</span></label>
                <input name="roleKey" value={formData.roleKey} onChange={handleInputChange}
                  style={{ ...inputStyle, fontFamily: "monospace", borderColor: formErrors.roleKey ? "#ff4d4f" : "#d9d9d9" }}
                  placeholder="e.g., admin"
                  onFocus={e => e.target.style.borderColor = "#1890ff"} onBlur={e => e.target.style.borderColor = formErrors.roleKey ? "#ff4d4f" : "#d9d9d9"} />
                {errText(formErrors.roleKey)}
              </Col>
            </Row>

            {/* Row 2 — Role Type + Permission Level */}
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={12}>
                <label style={lbl}>Role Type <span style={{ color: "#ff4d4f" }}>*</span></label>
                <Select value={formData.roleType || undefined} onChange={v => { setFormData(prev => ({ ...prev, roleType: v })); setErr("roleType", v); }}
                  size="small" style={{ width: "100%" }} placeholder="Select type" status={formErrors.roleType ? "error" : ""}>
                  {roleTypes.map(t => (
                    <Option key={t.value} value={t.value}>
                      <Space size={4}><Tag color={t.color} style={{ fontSize: 10, margin: 0 }}>{t.label}</Tag></Space>
                    </Option>
                  ))}
                </Select>
                {errText(formErrors.roleType)}
              </Col>
              <Col span={12}>
                <label style={lbl}>Permission Level</label>
                <Select value={formData.permissionLevel} onChange={v => setFormData(prev => ({ ...prev, permissionLevel: v }))}
                  size="small" style={{ width: "100%" }}>
                  {permissionLevels.map(p => (
                    <Option key={p.value} value={p.value}>
                      <Tag color={p.color} style={{ fontSize: 10, margin: 0 }}>{p.label}</Tag>
                    </Option>
                  ))}
                </Select>
              </Col>
            </Row>

            {/* Row 3 — Description */}
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={24}>
                <label style={lbl}>Description</label>
                <Input.TextArea name="description" value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this role can do..." rows={3} size="small" maxLength={200} />
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
              <Button type="primary" loading={loading} onClick={handleSubmit} icon={editingRole ? <EditOutlined /> : <PlusOutlined />}>
                {loading ? "Saving..." : editingRole ? "Update Role" : "Create Role"}
              </Button>
            </div>
          </div>
        </>
      )}


      {/* ══ DELETE MODAL ══ */}
      {showDeleteModal && roleToDelete && (
        <>
          <div style={backdropStyle} onClick={closeDeleteModal} />
          <div style={{ ...modalBoxStyle("420px"), textAlign: "center" }}>
            <ExclamationCircleOutlined style={{ fontSize: 40, color: "#ff4d4f", marginBottom: 10 }} />
            <h3 style={{ color: "#ff4d4f", marginBottom: 6 }}>Delete Role</h3>
            <p style={{ fontSize: 14, marginBottom: 10 }}>Are you sure you want to delete this role?</p>
            <div style={{ backgroundColor: "#f5f5f5", padding: 12, borderRadius: 4, marginBottom: 12, textAlign: "left", fontSize: 13 }}>
              {[
                ["Role Name",   roleToDelete.roleName],
                ["Role Key",    roleToDelete.roleKey],
                ["Type",        roleTypes.find(t => t.value === roleToDelete.roleType)?.label || roleToDelete.roleType],
                ["Permission",  getPermLabel(roleToDelete.permissionLevel)],
                ["Users",       roleToDelete.userCount],
                ["Status",      roleToDelete.status],
              ].map(([k, v]) => <p key={k} style={{ margin: "3px 0" }}><strong>{k}:</strong> {v}</p>)}
            </div>
            <p style={{ color: "#ff7875", fontSize: 12, marginBottom: 16 }}>This action cannot be undone.</p>
            <Space>
              <Button onClick={closeDeleteModal}>Cancel</Button>
              <Button danger type="primary" onClick={handleDelete} icon={<DeleteOutlined />}>Delete Role</Button>
            </Space>
          </div>
        </>
      )}

    </div>
  );
};

export default AddRole;