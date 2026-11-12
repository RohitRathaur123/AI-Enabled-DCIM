// AddUser.jsx — compact AddCity style
import React, { useState } from "react";
import {
  Table, Row, Col, Typography, Space, Button, Select,
  message, Input, Switch, Divider, Avatar, Tooltip, Badge, Tag
} from "antd";
import {
  UserOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
  MailOutlined, PhoneOutlined, BankOutlined, LockOutlined,
  EyeOutlined, EyeInvisibleOutlined, CheckCircleOutlined,
  StopOutlined, TeamOutlined, PlusOutlined, SearchOutlined,
  ExclamationCircleOutlined, CloseOutlined
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

const AddUser = () => {
  const [loading, setLoading]               = useState(false);
  const [showModal, setShowModal]           = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete]     = useState(null);
  const [editingUser, setEditingUser]       = useState(null);
  const [showPassword, setShowPassword]     = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sortedInfo, setSortedInfo]         = useState({ columnKey: "id", order: "ascend" });
  const [searchText, setSearchText]         = useState("");
  const [roleFilter, setRoleFilter]         = useState("all");
  const [statusFilter, setStatusFilter]     = useState("all");

  const emptyForm = {
    username: "", fullName: "", email: "", phone: "",
    company: "", role: "user", status: true,
    password: "", confirmPassword: ""
  };

  const [formData, setFormData] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});

  const [users, setUsers] = useState([
    { id: 1, username: "john_doe",    fullName: "John Doe",    email: "john.doe@example.com",    phone: "+1 234 567 8900", company: "Acme Technologies",  role: "Admin",  status: "Active",   createdDate: "2024-01-15" },
    { id: 2, username: "jane_smith",  fullName: "Jane Smith",  email: "jane.smith@example.com",  phone: "+1 234 567 8901", company: "Acme Technologies",  role: "User",   status: "Active",   createdDate: "2024-02-20" },
    { id: 3, username: "mike_wilson", fullName: "Mike Wilson", email: "mike.wilson@example.com", phone: "+1 234 567 8902", company: "Tech Solutions Inc",   role: "Viewer", status: "Inactive", createdDate: "2024-03-10" },
  ]);

  // ── Computed ──────────────────────────────────────────────────────────────
  const totalCount    = users.length;
  const activeCount   = users.filter(u => u.status === "Active").length;
  const inactiveCount = users.filter(u => u.status !== "Active").length;

  const filteredUsers = users.filter(u => {
    const q = searchText.toLowerCase();
    const matchSearch  = !searchText || u.username.toLowerCase().includes(q) || u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.company.toLowerCase().includes(q);
    const matchRole    = roleFilter   === "all" || u.role.toLowerCase() === roleFilter.toLowerCase();
    const matchStatus  = statusFilter === "all" || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!formData.username)               errs.username = "Username is required";
    if (!formData.email)                  errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = "Invalid email format";
    if (!editingUser || formData.password) {
      if (!formData.password)             errs.password = "Password is required";
      else if (formData.password.length < 6) errs.password = "Min 6 characters";
      if (formData.password !== formData.confirmPassword) errs.confirmPassword = "Passwords do not match";
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: "" }));
  };

  const openAddModal = () => {
    setEditingUser(null); setFormData(emptyForm); setFormErrors({});
    setShowPassword(false); setShowConfirmPassword(false); setShowModal(true);
  };
  const openEditModal = (u) => {
    setEditingUser(u);
    setFormData({ username: u.username, fullName: u.fullName, email: u.email, phone: u.phone === "-" ? "" : u.phone, company: u.company === "-" ? "" : u.company, role: u.role.toLowerCase(), status: u.status === "Active", password: "", confirmPassword: "" });
    setFormErrors({});
    setShowPassword(false); setShowConfirmPassword(false); setShowModal(true);
  };
  const openDeleteModal  = (u) => { setUserToDelete(u); setShowDeleteModal(true); };
  const closeModal       = () => { setShowModal(false); setEditingUser(null); };
  const closeDeleteModal = () => { setShowDeleteModal(false); setUserToDelete(null); };

  const handleDelete = () => {
    if (userToDelete) { setUsers(users.filter(u => u.id !== userToDelete.id)); message.success("User deleted!"); closeDeleteModal(); }
  };

  const handleSubmit = () => {
    if (!validate()) { message.error("Please fix the errors in the form"); return; }
    setLoading(true);
    setTimeout(() => {
      if (editingUser) {
        setUsers(users.map(u => u.id === editingUser.id ? { ...u, username: formData.username, fullName: formData.fullName, email: formData.email, phone: formData.phone || "-", company: formData.company || "-", role: formData.role, status: formData.status ? "Active" : "Inactive" } : u));
        message.success("User updated successfully!");
      } else {
        setUsers([...users, { id: Date.now(), username: formData.username, fullName: formData.fullName || formData.username, email: formData.email, phone: formData.phone || "-", company: formData.company || "-", role: formData.role, status: formData.status ? "Active" : "Inactive", createdDate: new Date().toISOString().split("T")[0] }]);
        message.success("User added successfully!");
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

  const roleColor = (r) => r === "Admin" ? "#1890ff" : r === "User" ? "#52c41a" : "#722ed1";

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 52,
      sorter: (a, b) => a.id - b.id, sortOrder: sortedInfo.columnKey === "id" && sortedInfo.order,
      render: t => <Text style={{ fontSize: 11 }}>{t}</Text> },
    { title: "User", key: "user", width: 160, ellipsis: true,
      sorter: (a, b) => a.username.localeCompare(b.username), sortOrder: sortedInfo.columnKey === "user" && sortedInfo.order,
      render: (_, r) => (
        <Space size={4}>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: r.status === "Active" ? "#1890ff" : "#d9d9d9", flexShrink: 0 }} size={20} />
          <div>
            <Text strong style={{ fontSize: 11 }}>{r.username}</Text>
            <div><Text type="secondary" style={{ fontSize: 10 }}>{r.fullName}</Text></div>
          </div>
        </Space>
      ) },
    { title: "Email", dataIndex: "email", key: "email", width: 180, ellipsis: true,
      sorter: (a, b) => a.email.localeCompare(b.email),
      render: t => <Space size={4}><MailOutlined style={{ color: "#1890ff", fontSize: 10 }} /><Text style={{ fontSize: 11 }}>{t}</Text></Space> },
    { title: "Phone", dataIndex: "phone", key: "phone", width: 130,
      render: t => <Space size={4}><PhoneOutlined style={{ color: "#52c41a", fontSize: 10 }} /><Text style={{ fontSize: 11 }}>{t}</Text></Space> },
    { title: "Company", dataIndex: "company", key: "company", width: 150, ellipsis: true,
      sorter: (a, b) => a.company.localeCompare(b.company),
      render: t => <Space size={4}><BankOutlined style={{ color: "#722ed1", fontSize: 10 }} /><Text style={{ fontSize: 11 }}>{t}</Text></Space> },
    { title: "Role", dataIndex: "role", key: "role", width: 80,
      sorter: (a, b) => a.role.localeCompare(b.role), sortOrder: sortedInfo.columnKey === "role" && sortedInfo.order,
      render: t => <Tag color={roleColor(t)} style={{ fontSize: 10 }}>{t}</Tag>,
      filters: [{ text: "Admin", value: "Admin" }, { text: "User", value: "User" }, { text: "Viewer", value: "Viewer" }],
      onFilter: (v, r) => r.role === v },
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
            <TeamOutlined style={{ marginRight: 8, color: "#1890ff" }} />
            User Management
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>Manage system users and permissions</Text>
        </div>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal} size="small"
            style={{ background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)", border: "none" }}>
            Add User
          </Button>
          <Button icon={<ReloadOutlined />} size="small" onClick={() => window.location.reload()}>Refresh</Button>
        </Space>
      </div>

      {/* ── STAT CARDS ── */}
      <Row gutter={10} style={{ marginBottom: 8, flexShrink: 0 }}>
        <Col span={8}><StatCard label="Total Users"   value={totalCount}    color="#1890ff" icon={<TeamOutlined        style={{ color: "#1890ff" }} />} /></Col>
        <Col span={8}><StatCard label="Active"        value={activeCount}   color="#52c41a" icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />} /></Col>
        <Col span={8}><StatCard label="Inactive"      value={inactiveCount} color="#8c8c8c" icon={<StopOutlined        style={{ color: "#8c8c8c" }} />} /></Col>
      </Row>

      {/* ── FILTERS ── */}
      <div style={{ backgroundColor: "white", borderRadius: 6, padding: "8px 12px", marginBottom: 8, flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={24} md={10} lg={10}>
            <Input placeholder="Search by username, name, email, company..." prefix={<SearchOutlined style={{ color: "#bbb" }} />}
              value={searchText} onChange={e => setSearchText(e.target.value)} allowClear size="small" />
          </Col>
          <Col xs={8} sm={6} md={5} lg={5}>
            <Select value={roleFilter} onChange={setRoleFilter} size="small" style={{ width: "100%" }}>
              <Option value="all">All Roles</Option>
              <Option value="admin">Admin</Option>
              <Option value="user">User</Option>
              <Option value="viewer">Viewer</Option>
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
            <Text style={{ fontSize: 12, color: "#888", whiteSpace: "nowrap" }}>{filteredUsers.length} / {totalCount} shown</Text>
          </Col>
        </Row>
      </div>

      {/* ── TABLE ── */}
      <div style={{ flex: 1, backgroundColor: "white", borderRadius: 6, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ padding: "7px 14px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <Text strong style={{ fontSize: 13 }}>Users List</Text>
          <Badge count={filteredUsers.length} style={{ backgroundColor: "#1890ff" }} />
        </div>
        <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
          <Table
            columns={columns} dataSource={filteredUsers} loading={loading}
            bordered={false} rowKey="id" size="small" scroll={{ x: "max-content" }}
            pagination={{ pageSize: 8, showSizeChanger: false, showTotal: total => `${total} users`, size: "small", style: { padding: "5px 14px", margin: 0 } }}
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
              <h3 style={{ margin: 0, color: "#1890ff", fontSize: 15 }}>{editingUser ? "Edit User" : "Add New User"}</h3>
              <Button type="text" icon={<CloseOutlined />} onClick={closeModal} style={{ color: "#666" }} />
            </div>

            {/* Row 1 — Username + Full Name */}
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={12}>
                <label style={lbl}>Username <span style={{ color: "#ff4d4f" }}>*</span></label>
                <input name="username" value={formData.username} onChange={handleInputChange}
                  style={{ ...inputStyle, borderColor: formErrors.username ? "#ff4d4f" : "#d9d9d9" }}
                  placeholder="e.g., john_doe"
                  onFocus={e => e.target.style.borderColor = "#1890ff"} onBlur={e => e.target.style.borderColor = formErrors.username ? "#ff4d4f" : "#d9d9d9"} />
                {errText(formErrors.username)}
              </Col>
              <Col span={12}>
                <label style={lbl}>Full Name</label>
                <input name="fullName" value={formData.fullName} onChange={handleInputChange}
                  style={{ ...inputStyle, borderColor: "#d9d9d9" }} placeholder="e.g., John Doe"
                  onFocus={e => e.target.style.borderColor = "#1890ff"} onBlur={e => e.target.style.borderColor = "#d9d9d9"} />
              </Col>
            </Row>

            {/* Row 2 — Email */}
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={24}>
                <label style={lbl}>Email <span style={{ color: "#ff4d4f" }}>*</span></label>
                <input name="email" type="email" value={formData.email} onChange={handleInputChange}
                  style={{ ...inputStyle, borderColor: formErrors.email ? "#ff4d4f" : "#d9d9d9" }}
                  placeholder="e.g., john@example.com"
                  onFocus={e => e.target.style.borderColor = "#1890ff"} onBlur={e => e.target.style.borderColor = formErrors.email ? "#ff4d4f" : "#d9d9d9"} />
                {errText(formErrors.email)}
              </Col>
            </Row>

            {/* Row 3 — Phone + Company */}
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={12}>
                <label style={lbl}>Phone</label>
                <input name="phone" value={formData.phone} onChange={handleInputChange}
                  style={{ ...inputStyle, borderColor: "#d9d9d9" }} placeholder="e.g., +1 234 567 8900"
                  onFocus={e => e.target.style.borderColor = "#1890ff"} onBlur={e => e.target.style.borderColor = "#d9d9d9"} />
              </Col>
              <Col span={12}>
                <label style={lbl}>Company</label>
                <input name="company" value={formData.company} onChange={handleInputChange}
                  style={{ ...inputStyle, borderColor: "#d9d9d9" }} placeholder="e.g., Acme Technologies"
                  onFocus={e => e.target.style.borderColor = "#1890ff"} onBlur={e => e.target.style.borderColor = "#d9d9d9"} />
              </Col>
            </Row>

            {/* Row 4 — Role + Status */}
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={12}>
                <label style={lbl}>Role <span style={{ color: "#ff4d4f" }}>*</span></label>
                <Select value={formData.role} onChange={v => setFormData(prev => ({ ...prev, role: v }))} size="small" style={{ width: "100%" }}>
                  <Option value="admin">Admin</Option>
                  <Option value="user">User</Option>
                  <Option value="viewer">Viewer</Option>
                </Select>
              </Col>
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

            <Divider style={{ margin: "10px 0" }}>
              <Space size={4}><LockOutlined style={{ color: "#1890ff" }} /><Text style={{ fontSize: 12 }} strong>Password</Text></Space>
            </Divider>

            {/* Row 5 — Password + Confirm */}
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={12}>
                <label style={lbl}>Password {!editingUser && <span style={{ color: "#ff4d4f" }}>*</span>}</label>
                <div style={{ position: "relative" }}>
                  <input name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleInputChange}
                    style={{ ...inputStyle, borderColor: formErrors.password ? "#ff4d4f" : "#d9d9d9", paddingRight: 32 }}
                    placeholder={editingUser ? "Leave blank to keep current" : "Min 6 characters"}
                    onFocus={e => e.target.style.borderColor = "#1890ff"} onBlur={e => e.target.style.borderColor = formErrors.password ? "#ff4d4f" : "#d9d9d9"} />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#1890ff", fontSize: 16, display: "flex", alignItems: "center" }}>
                    {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </button>
                </div>
                {errText(formErrors.password)}
              </Col>
              <Col span={12}>
                <label style={lbl}>Confirm Password {!editingUser && <span style={{ color: "#ff4d4f" }}>*</span>}</label>
                <div style={{ position: "relative" }}>
                  <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={handleInputChange}
                    style={{ ...inputStyle, borderColor: formErrors.confirmPassword ? "#ff4d4f" : "#d9d9d9", paddingRight: 32 }}
                    placeholder="Confirm password"
                    onFocus={e => e.target.style.borderColor = "#1890ff"} onBlur={e => e.target.style.borderColor = formErrors.confirmPassword ? "#ff4d4f" : "#d9d9d9"} />
                  <button type="button" onClick={() => setShowConfirmPassword(p => !p)}
                    style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#1890ff", fontSize: 16, display: "flex", alignItems: "center" }}>
                    {showConfirmPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                  </button>
                </div>
                {errText(formErrors.confirmPassword)}
              </Col>
            </Row>

            <Divider style={{ margin: "12px 0" }} />
            <div style={{ textAlign: "right" }}>
              <Button onClick={closeModal} style={{ marginRight: 8 }}>Cancel</Button>
              <Button type="primary" loading={loading} onClick={handleSubmit} icon={editingUser ? <EditOutlined /> : <PlusOutlined />}>
                {loading ? "Saving..." : editingUser ? "Update User" : "Create User"}
              </Button>
            </div>
          </div>
        </>
      )}


      {/* ══ DELETE MODAL ══ */}
      {showDeleteModal && userToDelete && (
        <>
          <div style={backdropStyle} onClick={closeDeleteModal} />
          <div style={{ ...modalBoxStyle("440px"), textAlign: "center" }}>
            <ExclamationCircleOutlined style={{ fontSize: 40, color: "#ff4d4f", marginBottom: 10 }} />
            <h3 style={{ color: "#ff4d4f", marginBottom: 6 }}>Delete User</h3>
            <p style={{ fontSize: 14, marginBottom: 10 }}>Are you sure you want to delete this user?</p>
            <div style={{ backgroundColor: "#f5f5f5", padding: 12, borderRadius: 4, marginBottom: 12, textAlign: "left", fontSize: 13 }}>
              {[
                ["Username", userToDelete.username],
                ["Name",     userToDelete.fullName],
                ["Email",    userToDelete.email],
                ["Role",     userToDelete.role],
                ["Company",  userToDelete.company],
                ["Status",   userToDelete.status],
              ].map(([k, v]) => <p key={k} style={{ margin: "3px 0" }}><strong>{k}:</strong> {v}</p>)}
            </div>
            <p style={{ color: "#ff7875", fontSize: 12, marginBottom: 16 }}>This action cannot be undone.</p>
            <Space>
              <Button onClick={closeDeleteModal}>Cancel</Button>
              <Button danger type="primary" onClick={handleDelete} icon={<DeleteOutlined />}>Delete User</Button>
            </Space>
          </div>
        </>
      )}

    </div>
  );
};

export default AddUser;