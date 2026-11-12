import React, { useState, useEffect, useCallback } from "react";
import {
  Table, Alert, Row, Col, Typography, Space,
  Button, Select, message, Input, Tooltip, Badge, Tag, Modal, Descriptions, Divider,
  Spin, List, Empty
} from "antd";
import {
  EditOutlined, ReloadOutlined,
  PlusOutlined, SearchOutlined, CloseOutlined,
  TableOutlined, ClockCircleOutlined, BugOutlined,
  FlagOutlined, SolutionOutlined, UserAddOutlined, CheckCircleOutlined,
  EyeOutlined, PaperClipOutlined, CheckOutlined, StopOutlined, AuditOutlined,
  HistoryOutlined, FileTextOutlined
} from "@ant-design/icons";
import TicketAttachments from "./ticketattachemet";
import { axiosdevice, axiosTicket, userApiClient, USER_API_ENABLED } from "../../config";

// Reads the "email" claim from a JWT without the jwt-decode package. Returns ""
// for anything that is not a real token (the static demo login stores a placeholder).
const jwtEmail = (token) => {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(part).split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
    );
    return JSON.parse(json).email || "";
  } catch {
    return "";
  }
};

const { Title, Text } = Typography;
const { Option } = Select;

// ---- These must match the backend's enum-like string values ----
const PRIORITIES = ["Low", "Normal", "High", "Critical"];
const SEVERITIES = ["Low", "Medium", "High", "Critical"];
const STATUSES = ["Open", "Assigned", "Escalated", "Resolved", "Closed"];
const CATEGORIES = ["Network", "Hardware", "Software", "Security", "Database", "Application"];
const TICKET_SOURCES = ["Manual", "System"];

// ---- Safely decode the logged-in user's email from the stored JWT ----
const tokendata = localStorage.getItem("token") || localStorage.getItem("authToken");
const emaildata = tokendata ? jwtEmail(tokendata) : "";

const emptyForm = {
  title: "",
  description: "",
  category: "",
  subCategory: "",
  reporterId: emaildata ?? "",
  severity: "Medium",
  priority: "Normal",
  slaId: undefined,
  latitude: undefined,
  longitude: undefined,
  landmark: "",
  ticketType: "Human",
  deviceId: "",
  projectName: "",
  alertId: "",
  ticketSource: "",
  workOrderTemplateId: undefined,
  scheduledStart: undefined,
  scheduledEnd: undefined,
};

// ---- Shared field styles (kept consistent across the whole form) ----
const labelStyle = { display: "block", marginBottom: 4, fontWeight: 500, fontSize: 12, color: "#444" };
const requiredMark = <span style={{ color: "#ff4d4f" }}> *</span>;

const TicketManagement = ({ authToken }) => {

  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);

  const [slaOptions, setSlaOptions] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersFetched, setUsersFetched] = useState(false);

  const [woTemplates, setWoTemplates] = useState([]);
  const [woTemplatesLoading, setWoTemplatesLoading] = useState(false);
  const [woTemplatesFetched, setWoTemplatesFetched] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningTicket, setAssigningTicket] = useState(null);
  const [assigneeId, setAssigneeId] = useState("");

  // ---- Ticket View Popup ----
  const [showViewModal, setShowViewModal] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);

  // ---- Audit view popup ----
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditTicketId, setAuditTicketId] = useState(null);
  const [auditData, setAuditData] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // ---- Unified action modal: Approve / Reject / Close ----
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionTicket, setActionTicket] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [actionNotes, setActionNotes] = useState("");
  const [resolutionText, setResolutionText] = useState("");
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [devicelist, setdevicelist] = useState([]);

  // filters
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [priorityFilter, setPriorityFilter] = useState(undefined);
  const [severityFilter, setSeverityFilter] = useState(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (priorityFilter) params.set("priority", priorityFilter);
    if (severityFilter) params.set("severity", severityFilter);
    if (searchText) params.set("search", searchText);
    params.set("page", page);
    params.set("pageSize", pageSize);
    return params.toString();
  }, [statusFilter, priorityFilter, severityFilter, searchText, page, pageSize]);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await axiosTicket.get(`/tickets?${buildQuery()}`);
      setTickets(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err?.message || "Could not load tickets");
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  const fetchSlas = useCallback(async () => {
    try {
      const data = await axiosTicket.get(`/sla`);
      setSlaOptions(data);
    } catch {
      // non-fatal
    }
  }, []);

  // ---- Users list: GET /api/users — handles every response shape ----
  const fetchUsers = useCallback(async () => {
    if (usersFetched) return;
    // The User API is not connected yet (login is still static): no request.
    if (!USER_API_ENABLED) {
      setUsers([]);
      setUsersFetched(true);
      return;
    }
    setUsersLoading(true);
    try {
      const res = await userApiClient.get(`/api/users`);
      // Handles: raw array, axios-wrapped {data: [...]}, or already-unwrapped object
      let data = res;
      if (res && !Array.isArray(res) && Array.isArray(res.data)) {
        data = res.data;
      }
      setUsers(Array.isArray(data) ? data : []);
      setUsersFetched(true);
    } catch (err) {
      console.error("users fetch error", err);
      message.error("Could not load users list");
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, [usersFetched]);

  // ---- Work Order Templates: GET /api/workordertemplates?activeOnly=true ----
  const fetchWoTemplates = useCallback(async () => {
    if (woTemplatesFetched) return;
    setWoTemplatesLoading(true);
    try {
      const res = await axiosTicket.get(`/workordertemplates?activeOnly=true`);
      let data = res;
      if (res && !Array.isArray(res) && Array.isArray(res.data)) {
        data = res.data;
      }
      setWoTemplates(Array.isArray(data) ? data : []);
      setWoTemplatesFetched(true);
    } catch (err) {
      console.error("work order templates fetch error", err);
      setWoTemplates([]);
    } finally {
      setWoTemplatesLoading(false);
    }
  }, [woTemplatesFetched]);

  const fetchDevice = async () => {
    try {
      const res = await axiosdevice.get('/DeviceDetail/get-all-devicedetail');
      setdevicelist(Array.isArray(res) ? res : (res?.data || []));
    } catch (error) {
      console.error("device fetch error", error);
      setdevicelist([]);
    }
  };

  const handleDeviceDropDown = (open) => {
    if (open) fetchDevice();
  };

  const handleUserDropDown = (open) => {
    if (open) fetchUsers();
  };

  const handleWoTemplateDropDown = (open) => {
    if (open) fetchWoTemplates();
  };

  useEffect(() => { fetchTickets(); }, [fetchTickets]);
  useEffect(() => { fetchSlas(); }, [fetchSlas]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchWoTemplates(); }, [fetchWoTemplates]);

  const userLabel = (idOrEmail) => {
    if (!idOrEmail) return "-";
    const found = users.find((u) => u.id === idOrEmail || u.email === idOrEmail);
    return found ? found.email : idOrEmail;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ---- Work order template select: prefill related fields, keep everything editable ----
  const handleWoTemplateChange = (templateId) => {
    if (!templateId) {
      setFormData((prev) => ({ ...prev, workOrderTemplateId: undefined }));
      return;
    }
    const tpl = woTemplates.find((t) => t.id === templateId);
    setFormData((prev) => ({
      ...prev,
      workOrderTemplateId: templateId,
      category: tpl?.category || prev.category,
      subCategory: tpl?.subCategory || prev.subCategory,
      description: tpl?.defaultDescription || prev.description,
      priority: tpl?.defaultPriority || prev.priority,
      slaId: tpl?.defaultSLAId ?? prev.slaId,
    }));
    message.success(`Template "${tpl?.name}" applied — fields prefilled, feel free to edit`);
  };

  const openAddModal = () => {
    setEditingTicket(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (ticket) => {
    setEditingTicket(ticket);
    setFormData({
      title: ticket.ticketTitle || ticket.title || "",
      description: ticket.description || "",
      category: ticket.category || "",
      subCategory: ticket.subCategory || "",
      reporterId: ticket.reporterId || "",
      severity: ticket.severity || "Medium",
      priority: ticket.priority || "Normal",
      slaId: ticket.slaId,
      latitude: ticket.latitude,
      longitude: ticket.longitude,
      landmark: ticket.landmark || "",
      ticketType: ticket.ticketType || "Human",
      deviceId: ticket.deviceId || "",
      projectName: ticket.projectName || "",
      alertId: ticket.alertId || "",
      ticketSource: ticket.ticketSource || "",
      workOrderTemplateId: ticket.workOrderTemplateId,
      scheduledStart: ticket.scheduledStart || undefined,
      scheduledEnd: ticket.scheduledEnd || undefined,
    });
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const openViewModal = (ticket) => {
    setActiveTicket(ticket);
    setShowViewModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.category || !formData.priority || !formData.slaId) {
      setError("Title, Category, Priority and SLA are required");
      return;
    }
    setSaving(true);
    try {
      if (editingTicket) {
        await axiosTicket.put(`/tickets/${editingTicket.ticketId}`, formData);
      } else {
        await axiosTicket.post(`/tickets`, formData);
      }
      message.success(editingTicket ? "Ticket updated!" : "Ticket created!");
      setShowModal(false);
      fetchTickets();
    } catch (err) {
      setError(err?.message || "Could not save ticket");
    } finally {
      setSaving(false);
    }
  };

  const openAssignModal = (ticket) => {
    setAssigningTicket(ticket);
    setAssigneeId(ticket.assignedToId || "");
    setShowAssignModal(true);
    fetchUsers();
  };

  const handleAssign = async () => {
    if (!assigneeId) {
      message.warning("Select a user to assign");
      return;
    }
    try {
      await axiosTicket.patch(`/tickets/${assigningTicket.ticketId}/assign`, assigneeId);
      message.success(`Assigned to ${userLabel(assigneeId)}`);
      setShowAssignModal(false);
      fetchTickets();
    } catch (err) {
      message.error(err?.message || "Could not assign ticket");
    }
  };

  // ---------------------------------------------------------------
  // Device name / SLA name resolution for the view popup
  // ---------------------------------------------------------------
  const [deviceName, setDeviceName] = useState("");
  const [slaName, setSlaName] = useState("");
  const [loadingDeviceSla, setLoadingDeviceSla] = useState(false);

  useEffect(() => {
    if (!activeTicket) {
      setDeviceName("");
      setSlaName("");
      return;
    }
    const fetchDeviceAndSla = async () => {
      setLoadingDeviceSla(true);
      if (activeTicket.deviceId) {
        try {
          const res = await axiosdevice.get(`/DeviceDetail/get-devicedetail${activeTicket.deviceId}`);
          const data = res;
          setDeviceName(data.shortName || data.longName || activeTicket.deviceId);
        } catch (err) {
          console.error("Device fetch failed:", err);
          setDeviceName(activeTicket.deviceId);
        }
      } else {
        setDeviceName("");
      }
      if (activeTicket.slaId) {
        try {
          const res = await axiosTicket.get(`/sla/${activeTicket.slaId}`);
          setSlaName(res.name || String(activeTicket.slaId));
        } catch (err) {
          console.error("SLA fetch failed:", err);
          setSlaName(String(activeTicket.slaId));
        }
      } else {
        setSlaName("");
      }
      setLoadingDeviceSla(false);
    };
    fetchDeviceAndSla();
  }, [activeTicket]);

  // ---------------------------------------------------------------
  // Audit popup — GET /api/tickets/{id}/audit
  // ---------------------------------------------------------------
  const openAuditModal = async (ticketId) => {
    setAuditTicketId(ticketId);
    setShowAuditModal(true);
    setAuditLoading(true);
    try {
      const data = await axiosTicket.get(`/tickets/${ticketId}/audit`);
      setAuditData(Array.isArray(data) ? data : []);
    } catch (err) {
      message.error(err?.message || "Could not load audit trail");
      setAuditData([]);
    } finally {
      setAuditLoading(false);
    }
  };

  const closeAuditModal = () => {
    setShowAuditModal(false);
    setAuditTicketId(null);
    setAuditData([]);
  };

  // ---------------------------------------------------------------
  // Unified Approve / Reject / Close action
  // ---------------------------------------------------------------
  const openActionModal = (ticket) => {
    setActionTicket(ticket);
    setActionType(null);
    setActionNotes("");
    setResolutionText("");
    setShowActionModal(true);
  };

  const closeActionModal = () => {
    setShowActionModal(false);
    setActionTicket(null);
    setActionType(null);
  };

  const backToActionPicker = () => setActionType(null);

  const handleActionSubmit = async () => {
    if (!actionTicket) return;

    if (actionType === "approve" || actionType === "reject") {
      setActionSubmitting(true);
      try {
        const endpoint = actionType === "approve" ? "approve" : "reject";
        await axiosTicket.post(`/tickets/${actionTicket.ticketId}/${endpoint}`, { notes: actionNotes });
        message.success(actionType === "approve" ? "Ticket approved!" : "Ticket rejected!");
        closeActionModal();
        fetchTickets();
      } catch (err) {
        message.error(err?.message || `Could not ${actionType} ticket`);
      } finally {
        setActionSubmitting(false);
      }
      return;
    }

    if (actionType === "close") {
      if (!resolutionText) {
        message.warning("Enter a resolution note");
        return;
      }
      setActionSubmitting(true);
      try {
        await axiosTicket.patch(`/tickets/${actionTicket.ticketId}/close`, resolutionText);
        message.success("Ticket closed");
        closeActionModal();
        fetchTickets();
      } catch (err) {
        message.error(err?.message || "Could not close ticket");
      } finally {
        setActionSubmitting(false);
      }
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Critical": return "#ff4d4f";
      case "High": return "#fa8c16";
      case "Normal":
      case "Medium": return "#faad14";
      case "Low": return "#52c41a";
      default: return "#d9d9d9";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Open": return "processing";
      case "Assigned": return "processing";
      case "Escalated": return "error";
      case "Resolved": return "success";
      case "Closed": return "default";
      default: return "default";
    }
  };

  const columns = [
    { title: "ID", dataIndex: "ticketId", key: "ticketId", width: 60, sorter: (a, b) => a.ticketId - b.ticketId },
    {
      title: "Title", dataIndex: "ticketTitle", key: "ticketTitle", width: 220,
      render: (text, record) => (
        <Tooltip title={text}>
          <Space size={5}>
            <BugOutlined style={{ color: getPriorityColor(record.priority), fontSize: 12 }} />
            <Text style={{ fontSize: 12 }}>
              {text && text.length > 40 ? text.substring(0, 40) + "…" : text}
            </Text>
            {record.attachmentCount > 0 && (
              <Tooltip title={`${record.attachmentCount} attachment(s)`}>
                <PaperClipOutlined style={{ fontSize: 11, color: "#999" }} />
              </Tooltip>
            )}
          </Space>
        </Tooltip>
      ),
    },
    { title: "Category", dataIndex: "category", key: "category", width: 100, render: (t) => <Tag style={{ fontSize: 11 }}>{t}</Tag> },
    { title: "Severity", dataIndex: "severity", key: "severity", width: 90, render: (t) => <Tag style={{ fontSize: 11 }}>{t}</Tag> },
    {
      title: "Priority", dataIndex: "priority", key: "priority", width: 90,
      render: (t) => <Badge color={getPriorityColor(t)} text={<span style={{ fontSize: 11 }}>{t}</span>} />,
    },
    {
      title: "Status", dataIndex: "status", key: "status", width: 100,
      render: (t) => <Badge status={getStatusBadge(t)} text={<span style={{ fontSize: 11 }}>{t}</span>} />,
    },
    // { title: "Reporter", dataIndex: "reporterId", key: "reporterId", width: 150, render: (t) => <Text style={{ fontSize: 11 }}>{userLabel(t)}</Text> },
    {
      title: "Assigned To", dataIndex: "assignedToId", key: "assignedToId", width: 150,
      render: (t) => (t ? <Text style={{ fontSize: 11 }}>{userLabel(t)}</Text> : <Text type="secondary" style={{ fontSize: 11 }}>-</Text>),
    },
    {
      title: "SLA Deadline", dataIndex: "estimatedResolutionTime", key: "estimatedResolutionTime", width: 145,
      render: (t, record) => (
        <Space size={4}>
          <ClockCircleOutlined style={{ fontSize: 11, color: record.slaBreached ? "#ff4d4f" : "#999" }} />
          <Text style={{ fontSize: 11, color: record.slaBreached ? "#ff4d4f" : undefined }}>
            {t ? new Date(t).toLocaleString() : "-"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Actions", key: "actions", width: 220, fixed: "right",
      render: (_, record) => (
        <Space size={2}>
          <Tooltip title="View">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => openViewModal(record)} style={{ padding: "0 4px" }} />
          </Tooltip>
          <Tooltip title="Audit Trail">
            <Button type="text" size="small" icon={<HistoryOutlined />} onClick={() => openAuditModal(record.ticketId)} style={{ color: "#faad14", padding: "0 4px" }} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)} style={{ color: "#1890ff", padding: "0 4px" }} />
          </Tooltip>
          {record.status !== "Closed" && (
            <>
              <Tooltip title="Assign">
                <Button type="text" size="small" icon={<UserAddOutlined />} onClick={() => openAssignModal(record)} style={{ color: "#722ed1", padding: "0 4px" }} />
              </Tooltip>
              <Tooltip title="Approve / Reject / Close">
                <Button type="text" size="small" icon={<AuditOutlined />} onClick={() => openActionModal(record)} style={{ color: "#52c41a", padding: "0 4px" }} />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  const backdropStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000 };
  const taStyle = { width: "100%", border: "1px solid #d9d9d9", borderRadius: 6, padding: "6px 10px", fontSize: 12, resize: "vertical", fontFamily: "inherit", outline: "none", minHeight: 62, boxSizing: "border-box" };

  const pickerCardStyle = () => ({
    flex: 1,
    border: "1px solid #d9d9d9",
    borderRadius: 8,
    padding: "14px 10px",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.15s",
  });

  const openTickets = tickets.filter((t) => t.status === "Open").length;
  const escalatedTickets = tickets.filter((t) => t.status === "Escalated").length;

  // Reusable section header for the create/edit form
  const SectionHeader = ({ icon, label }) => (
    <div style={{
      fontSize: 12, fontWeight: 700, color: "#1890ff", letterSpacing: 0.3,
      textTransform: "uppercase", marginBottom: 10, marginTop: 4,
      display: "flex", alignItems: "center", gap: 6,
      borderBottom: "1px solid #f0f0f0", paddingBottom: 6
    }}>
      {icon} {label}
    </div>
  );

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f0f2f5", padding: "10px 16px", boxSizing: "border-box", overflow: "hidden" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexShrink: 0 }}>
        <div>
          <Title level={4} style={{ margin: 0, lineHeight: 1.3 }}>
            <SolutionOutlined style={{ marginRight: 8, color: "#1890ff" }} />
            Ticket Management
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>Manage IT support tickets</Text>
        </div>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal} size="small"
            style={{ background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)", border: "none" }}>
            Create Ticket
          </Button>
          <Button icon={<ReloadOutlined />} size="small" onClick={fetchTickets}>Refresh</Button>
        </Space>
      </div>

      {error && <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} style={{ marginBottom: 6, padding: "4px 12px", fontSize: 12, flexShrink: 0 }} />}

      {/* STAT CARDS */}
      <Row gutter={10} style={{ marginBottom: 8, flexShrink: 0 }}>
        {[
          { label: "Total (this page)", value: total, color: "#1890ff", icon: <TableOutlined /> },
          { label: "Open", value: openTickets, color: "#1890ff", icon: <BugOutlined /> },
          { label: "Escalated", value: escalatedTickets, color: "#ff4d4f", icon: <FlagOutlined /> },
        ].map(({ label, value, color, icon }) => (
          <Col key={label} span={8}>
            <div style={{ backgroundColor: "white", borderRadius: 6, padding: "8px 14px", borderTop: `3px solid ${color}`, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22, color }}>{icon}</span>
              <div>
                <div style={{ fontSize: 11, color: "#888", lineHeight: 1.3 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* FILTERS */}
      <div style={{ backgroundColor: "white", borderRadius: 6, padding: "8px 12px", marginBottom: 8, flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <Row gutter={12} align="middle">
          <Col xs={24} sm={12} md={7}>
            <Input
              placeholder="Search title / description..."
              prefix={<SearchOutlined style={{ color: "#bbb" }} />}
              value={searchText}
              onChange={(e) => { setSearchText(e.target.value); setPage(1); }}
              allowClear size="small"
            />
          </Col>
          <Col xs={12} sm={4} md={4}>
            <Select value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} size="small" style={{ width: "100%" }} placeholder="Status" allowClear>
              {STATUSES.map((s) => <Option key={s} value={s}>{s}</Option>)}
            </Select>
          </Col>
          <Col xs={12} sm={4} md={4}>
            <Select value={priorityFilter} onChange={(v) => { setPriorityFilter(v); setPage(1); }} size="small" style={{ width: "100%" }} placeholder="Priority" allowClear>
              {PRIORITIES.map((p) => <Option key={p} value={p}>{p}</Option>)}
            </Select>
          </Col>
          <Col xs={12} sm={4} md={4}>
            <Select value={severityFilter} onChange={(v) => { setSeverityFilter(v); setPage(1); }} size="small" style={{ width: "100%" }} placeholder="Severity" allowClear>
              {SEVERITIES.map((s) => <Option key={s} value={s}>{s}</Option>)}
            </Select>
          </Col>
          <Col xs={24} sm={24} md={5} style={{ textAlign: "right" }}>
            <Text style={{ fontSize: 12, color: "#888" }}>{total} tickets total</Text>
          </Col>
        </Row>
      </div>

      {/* TABLE */}
      <div style={{ flex: 1, backgroundColor: "white", borderRadius: 6, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ padding: "7px 14px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <Text strong style={{ fontSize: 13 }}>Tickets List</Text>
          <Badge count={total} style={{ backgroundColor: "#1890ff" }} />
        </div>
        <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
          <Table
            columns={columns} dataSource={tickets} loading={loading}
            bordered={false} rowKey="ticketId" size="small"
            scroll={{ x: 1200 }}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              pageSizeOptions: [10, 25, 50, 100],
              showTotal: (t) => `${t} tickets`,
              size: "small",
              style: { padding: "5px 14px", margin: 0 },
              onChange: (p, ps) => { setPage(p); setPageSize(ps); },
            }}
            style={{ fontSize: 12 }}
            locale={{ emptyText: <div style={{ padding: "12px 0", textAlign: "center", color: "#999", fontSize: 13 }}>No tickets found</div> }}
          />
        </div>
      </div>


      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <>
          <div style={backdropStyle} onClick={closeModal} />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            backgroundColor: "white", padding: "22px 26px", borderRadius: 12,
            width: "720px", maxWidth: "95vw", maxHeight: "90vh",
            overflowY: "auto", overflowX: "hidden",
            zIndex: 1001, boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
            boxSizing: "border-box"
          }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>
              <h3 style={{ margin: 0, color: "#1890ff", fontSize: 17, fontWeight: 700 }}>
                {editingTicket ? `Edit Ticket #${editingTicket.ticketId}` : "Create New Ticket"}
              </h3>
              <Button type="text" icon={<CloseOutlined />} onClick={closeModal} style={{ color: "#666" }} />
            </div>

            {/* ---- BASIC INFO ---- */}
            <SectionHeader icon={<SolutionOutlined />} label="Basic Information" />

            <Row gutter={16} style={{ marginBottom: 14 }}>
              <Col span={24}>
                <label style={labelStyle}>Title{requiredMark}</label>
                <Input name="title" value={formData.title} onChange={handleInputChange} placeholder="Brief title of the issue" size="middle" />
              </Col>
            </Row>

            {!editingTicket && (
              <Row gutter={16} style={{ marginBottom: 14 }}>
                <Col span={24}>
                  <label style={labelStyle}>
                    <FileTextOutlined style={{ marginRight: 4 }} />
                    Work Order Template <span style={{ color: "#999", fontWeight: 400 }}>(optional — auto-fills fields below)</span>
                  </label>
                  <Select
                    showSearch
                    allowClear
                    placeholder="Select a template to prefill category, description, priority & SLA"
                    value={formData.workOrderTemplateId}
                    onChange={handleWoTemplateChange}
                    onDropdownVisibleChange={handleWoTemplateDropDown}
                    loading={woTemplatesLoading}
                    size="middle"
                    style={{ width: "100%" }}
                    filterOption={(input, option) =>
                      (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {woTemplates.map((t) => (
                      <Option key={t.id} value={t.id}>
                        {t.name} {t.category ? `— ${t.category}` : ""}
                      </Option>
                    ))}
                  </Select>
                </Col>
              </Row>
            )}

            <Row gutter={16} style={{ marginBottom: 14 }}>
              <Col span={24}>
                <label style={labelStyle}>Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Detailed description of the problem..." style={taStyle} />
              </Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: 14 }}>
              <Col span={8}>
                <label style={labelStyle}>Category{requiredMark}</label>
                <Select placeholder="Select category" style={{ width: "100%" }} size="middle" value={formData.category || undefined} onChange={(v) => handleSelectChange("category", v)}>
                  {CATEGORIES.map((c) => <Option key={c} value={c}>{c}</Option>)}
                </Select>
              </Col>
              <Col span={8}>
                <label style={labelStyle}>Sub-category</label>
                <Input name="subCategory" value={formData.subCategory} onChange={handleInputChange} placeholder="e.g. Switch" size="middle" />
              </Col>
              <Col span={8}>
                <label style={labelStyle}>SLA{requiredMark}</label>
                <Select placeholder="Select SLA" style={{ width: "100%" }} size="middle" value={formData.slaId} onChange={(v) => handleSelectChange("slaId", v)}>
                  {slaOptions.map((s) => <Option key={s.id} value={s.id}>{s.name}</Option>)}
                </Select>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: 18 }}>
              <Col span={8}>
                <label style={labelStyle}>Severity</label>
                <Select style={{ width: "100%" }} size="middle" value={formData.severity} onChange={(v) => handleSelectChange("severity", v)}>
                  {SEVERITIES.map((s) => <Option key={s} value={s}>{s}</Option>)}
                </Select>
              </Col>
              <Col span={8}>
                <label style={labelStyle}>Priority{requiredMark}</label>
                <Select style={{ width: "100%" }} size="middle" value={formData.priority} onChange={(v) => handleSelectChange("priority", v)}>
                  {PRIORITIES.map((p) => <Option key={p} value={p}>{p}</Option>)}
                </Select>
              </Col>
              <Col span={8}>
                <label style={labelStyle}>Ticket Type</label>
                <Select style={{ width: "100%" }} size="middle" value={formData.ticketType} onChange={(v) => handleSelectChange("ticketType", v)}>
                  <Option value="Human">Human</Option>
                  <Option value="Machine">Machine</Option>
                  <Option value="Automatic">Automatic</Option>
                  <Option value="WorkOrder">WorkOrder</Option>
                  <Option value="ChangeRequest">ChangeRequest</Option>
                </Select>
              </Col>
            </Row>

            {/* ---- PEOPLE & PROJECT ---- */}
            <SectionHeader icon={<UserAddOutlined />} label="People & Project" />

            <Row gutter={16} style={{ marginBottom: 14 }}>
              <Col span={12}>
                <label style={labelStyle}>Reporter</label>
                <Input
                  name="reporterId"
                  value={formData.reporterId}
                  onChange={handleInputChange}
                  placeholder="Reporter email"
                  size="middle"
                />
              </Col>
              <Col span={12}>
                <label style={labelStyle}>Project Name</label>
                <Input name="projectName" value={formData.projectName} onChange={handleInputChange} placeholder="e.g. Campus Network" size="middle" />
              </Col>
            </Row>

            {/* ---- DEVICE & LOCATION ---- */}
            <SectionHeader icon={<FlagOutlined />} label="Device & Location" />

            <Row gutter={16} style={{ marginBottom: 14 }}>
              <Col span={12}>
                <label style={labelStyle}>Device</label>
                <Select
                  showSearch
                  allowClear
                  placeholder="Select device"
                  value={formData.deviceId || undefined}
                  onChange={(v) => handleSelectChange("deviceId", v)}
                  onDropdownVisibleChange={(open) => {
                    if (open && devicelist.length === 0) handleDeviceDropDown(open);
                  }}
                  size="middle"
                  style={{ width: "100%" }}
                  filterOption={(input, option) =>
                    (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {devicelist.map((d) => (
                    <Option key={d.id} value={d.id}>
                      {d.shortName || d.longName || d.serialNumber || d.id}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col span={12}>
                <label style={labelStyle}>Landmark</label>
                <Input name="landmark" value={formData.landmark} onChange={handleInputChange} placeholder="Near Server Room" size="middle" />
              </Col>
            </Row>

            <Row gutter={16} style={{ marginBottom: 18 }}>
              <Col span={12}>
                <label style={labelStyle}>Latitude</label>
                <Input name="latitude" value={formData.latitude ?? ""} onChange={handleInputChange} placeholder="28.61" size="middle" />
              </Col>
              <Col span={12}>
                <label style={labelStyle}>Longitude</label>
                <Input name="longitude" value={formData.longitude ?? ""} onChange={handleInputChange} placeholder="77.20" size="middle" />
              </Col>
            </Row>

            {/* ---- SOURCE & SCHEDULING ---- */}
            <SectionHeader icon={<ClockCircleOutlined />} label="Source & Scheduling" />

            <Row gutter={16} style={{ marginBottom: 14 }}>
              <Col span={16} >
                <label style={labelStyle}>Ticket Source</label>
                <Select
                  allowClear
                  placeholder="Select source"
                  style={{ width: "100%" }}
                  size="middle"
                  value={formData.ticketSource || undefined}
                  onChange={(v) => handleSelectChange("ticketSource", v)}
                >
                  {TICKET_SOURCES.map((s) => <Option key={s} value={s}>{s}</Option>)}
                </Select>
              </Col>
              {/* <Col span={12}>
                <label style={labelStyle}>Work Order Template ID</label>
                <Input
                  name="workOrderTemplateId"
                  value={formData.workOrderTemplateId ?? ""}
                  disabled
                  placeholder="Auto-filled from template above"
                  size="middle"
                  style={{ backgroundColor: "#fafafa" }}
                />
              </Col> */}
            </Row>

            <Row gutter={16} style={{ marginBottom: 4 }}>
              <Col span={12}>
                <label style={labelStyle}>Scheduled Start</label>
                <Input type="datetime-local" name="scheduledStart" value={formData.scheduledStart ?? ""} onChange={handleInputChange} size="middle" />
              </Col>
              <Col span={12}>
                <label style={labelStyle}>Scheduled End</label>
                <Input type="datetime-local" name="scheduledEnd" value={formData.scheduledEnd ?? ""} onChange={handleInputChange} size="middle" />
              </Col>
            </Row>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 22, paddingTop: 14, borderTop: "1px solid #f0f0f0" }}>
              <Button onClick={closeModal}>Cancel</Button>
              <Button type="primary" onClick={handleSubmit} loading={saving} icon={editingTicket ? <EditOutlined /> : <PlusOutlined />}>
                {saving ? "Saving..." : (editingTicket ? "Update Ticket" : "Create Ticket")}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* ASSIGN MODAL */}
      {showAssignModal && assigningTicket && (
        <>
          <div style={backdropStyle} onClick={() => setShowAssignModal(false)} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "white", padding: 20, borderRadius: 8, width: 400, maxWidth: "92%", zIndex: 1001, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
            <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 15 }}>Assign Ticket #{assigningTicket.ticketId}</h3>
            {!USER_API_ENABLED && (
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 10, fontSize: 12 }}
                message="The agent list comes from the User API, which is not connected yet. It will fill in once the real login is switched on."
              />
            )}
            <label style={labelStyle}>Agent</label>
            <Select
              showSearch
              allowClear
              placeholder={usersLoading ? "Loading users..." : "Select a user"}
              value={assigneeId || undefined}
              onChange={(v) => setAssigneeId(v)}
              onDropdownVisibleChange={handleUserDropDown}
              loading={usersLoading}
              notFoundContent={usersLoading ? <Spin size="small" /> : "No users found"}
              size="middle"
              style={{ width: "100%", marginBottom: 16 }}
              filterOption={(input, option) =>
                (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
              }
            >
              {users.map((u) => (
                <Option key={u.id} value={u.email}>{u.email}</Option>
              ))}
            </Select>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button onClick={() => setShowAssignModal(false)}>Cancel</Button>
              <Button type="primary" onClick={handleAssign} icon={<UserAddOutlined />}>Assign</Button>
            </div>
          </div>
        </>
      )}

      {/* UNIFIED APPROVE / REJECT / CLOSE ACTION MODAL */}
      {showActionModal && actionTicket && (
        <>
          <div style={backdropStyle} onClick={closeActionModal} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "white", padding: 20, borderRadius: 8, width: 440, maxWidth: "92%", zIndex: 1001, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <h3 style={{ margin: 0, fontSize: 15 }}>
                Ticket #{actionTicket.ticketId} — {actionTicket.ticketTitle}
              </h3>
              <Button type="text" size="small" icon={<CloseOutlined />} onClick={closeActionModal} />
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {actionTicket.ticketType}{actionTicket.approvalStatus ? ` · Approval: ${actionTicket.approvalStatus}` : ""}
            </Text>

            {!actionType && (
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <div style={pickerCardStyle()} onClick={() => setActionType("approve")}>
                  <CheckOutlined style={{ fontSize: 20, color: "#52c41a" }} />
                  <div style={{ fontSize: 13, fontWeight: 500, marginTop: 6 }}>Approve</div>
                </div>
                <div style={pickerCardStyle()} onClick={() => setActionType("reject")}>
                  <StopOutlined style={{ fontSize: 20, color: "#ff4d4f" }} />
                  <div style={{ fontSize: 13, fontWeight: 500, marginTop: 6 }}>Reject</div>
                </div>
                <div style={pickerCardStyle()} onClick={() => setActionType("close")}>
                  <CheckCircleOutlined style={{ fontSize: 20, color: "#1890ff" }} />
                  <div style={{ fontSize: 13, fontWeight: 500, marginTop: 6 }}>Close</div>
                </div>
              </div>
            )}

            {(actionType === "approve" || actionType === "reject") && (
              <div style={{ marginTop: 16 }}>
                <Tag color={actionType === "approve" ? "green" : "red"} style={{ marginBottom: 10 }}>
                  {actionType === "approve" ? "Approving this ticket" : "Rejecting this ticket"}
                </Tag>
                <label style={labelStyle}>Notes</label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder={actionType === "approve" ? "Optional notes for approval..." : "Reason for rejection..."}
                  style={taStyle}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
                  <Button onClick={backToActionPicker}>Back</Button>
                  <Button
                    type="primary"
                    danger={actionType === "reject"}
                    loading={actionSubmitting}
                    onClick={handleActionSubmit}
                    icon={actionType === "approve" ? <CheckOutlined /> : <StopOutlined />}
                  >
                    {actionSubmitting ? "Submitting..." : (actionType === "approve" ? "Approve Ticket" : "Reject Ticket")}
                  </Button>
                </div>
              </div>
            )}

            {actionType === "close" && (
              <div style={{ marginTop: 16 }}>
                <label style={labelStyle}>
                  Resolution note{requiredMark}
                </label>
                <textarea
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="How was this resolved?"
                  style={taStyle}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
                  <Button onClick={backToActionPicker}>Back</Button>
                  <Button type="primary" loading={actionSubmitting} onClick={handleActionSubmit} icon={<CheckCircleOutlined />}>
                    {actionSubmitting ? "Submitting..." : "Close Ticket"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* VIEW POPUP */}
      <Modal
        title={
          activeTicket ? (
            <Space direction="vertical" size={0}>
              <Text strong style={{ fontSize: 15 }}>
                #{activeTicket.ticketId} — {activeTicket.ticketTitle}
              </Text>
              <Space size={6}>
                <Badge status={getStatusBadge(activeTicket.status)} text={activeTicket.status} />
                <Tag color={getPriorityColor(activeTicket.priority)} style={{ margin: 0 }}>
                  {activeTicket.priority}
                </Tag>
                {activeTicket.slaBreached && <Tag color="red">SLA Breached</Tag>}
              </Space>
            </Space>
          ) : ""
        }
        open={showViewModal}
        onCancel={() => setShowViewModal(false)}
        footer={[
          <Button key="audit" icon={<HistoryOutlined />} onClick={() => activeTicket && openAuditModal(activeTicket.ticketId)}>
            View Audit
          </Button>,
          <Button key="close" type="primary" onClick={() => setShowViewModal(false)}>Close</Button>,
        ]}
        width={960}
        centered
        destroyOnClose
      >
        {activeTicket && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, maxHeight: "75vh", overflowY: "auto", overflowX: "hidden", paddingRight: 4 }}>

            <div>
              <Divider orientation="left" style={{ fontSize: 13, marginTop: 0 }}>
                <SolutionOutlined /> Overview
              </Divider>
              <Descriptions column={3} size="small" bordered>
                <Descriptions.Item label="Category">{activeTicket.category || "-"}</Descriptions.Item>
                <Descriptions.Item label="Sub-category">{activeTicket.subCategory || "-"}</Descriptions.Item>
                <Descriptions.Item label="Severity"><Tag>{activeTicket.severity}</Tag></Descriptions.Item>
                <Descriptions.Item label="Priority">
                  <Badge color={getPriorityColor(activeTicket.priority)} text={activeTicket.priority} />
                </Descriptions.Item>
                <Descriptions.Item label="Ticket Type">{activeTicket.ticketType || "-"}</Descriptions.Item>
                <Descriptions.Item label="Ticket Source">{activeTicket.ticketSource || "-"}</Descriptions.Item>
                <Descriptions.Item label="Project" span={3}>{activeTicket.projectName || "-"}</Descriptions.Item>
                <Descriptions.Item label="Description" span={3}>{activeTicket.description || "-"}</Descriptions.Item>
              </Descriptions>
            </div>

            <div>
              <Divider orientation="left" style={{ fontSize: 13 }}>
                <UserAddOutlined /> People
              </Divider>
              <Descriptions column={3} size="small" bordered>
                <Descriptions.Item label="Reporter">{userLabel(activeTicket.reporterId)}</Descriptions.Item>
                <Descriptions.Item label="Assigned To">{userLabel(activeTicket.assignedToId)}</Descriptions.Item>
                <Descriptions.Item label="Incident Logged By">{userLabel(activeTicket.incidentLoggedBy)}</Descriptions.Item>
                <Descriptions.Item label="Closed By">{userLabel(activeTicket.closedBy)}</Descriptions.Item>
                <Descriptions.Item label="Approved By">{userLabel(activeTicket.approvedBy)}</Descriptions.Item>
                <Descriptions.Item label="Approval Status">
                  {activeTicket.approvalStatus
                    ? <Tag color={activeTicket.approvalStatus === "Approved" ? "green" : activeTicket.approvalStatus === "Rejected" ? "red" : "gold"}>
                      {activeTicket.approvalStatus}
                    </Tag>
                    : "-"}
                </Descriptions.Item>
              </Descriptions>
            </div>

            <div>
              <Divider orientation="left" style={{ fontSize: 13 }}>
                <ClockCircleOutlined /> Timeline
              </Divider>
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="Incident On">
                  {activeTicket.incidentOn ? new Date(activeTicket.incidentOn).toLocaleString() : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Incident Logged On">
                  {activeTicket.incidentLoggedOn ? new Date(activeTicket.incidentLoggedOn).toLocaleString() : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="SLA Deadline">
                  <Space size={4}>
                    <ClockCircleOutlined style={{ color: activeTicket.slaBreached ? "#ff4d4f" : "#999" }} />
                    <span style={{ color: activeTicket.slaBreached ? "#ff4d4f" : undefined }}>
                      {activeTicket.estimatedResolutionTime ? new Date(activeTicket.estimatedResolutionTime).toLocaleString() : "-"}
                    </span>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Actual Elapsed">
                  {activeTicket.actualElapsedMinutes ? `${activeTicket.actualElapsedMinutes} min` : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Updated At">
                  {activeTicket.updatedAt ? new Date(activeTicket.updatedAt).toLocaleString() : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Resolved At">
                  {activeTicket.resolvedAt ? new Date(activeTicket.resolvedAt).toLocaleString() : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Closed At">
                  {activeTicket.closedAt ? new Date(activeTicket.closedAt).toLocaleString() : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Scheduled Start">
                  {activeTicket.scheduledStart ? new Date(activeTicket.scheduledStart).toLocaleString() : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Scheduled End">
                  {activeTicket.scheduledEnd ? new Date(activeTicket.scheduledEnd).toLocaleString() : "-"}
                </Descriptions.Item>
              </Descriptions>
            </div>

            <div>
              <Divider orientation="left" style={{ fontSize: 13 }}>
                <FlagOutlined /> Device & Location
              </Divider>
              <Descriptions column={3} size="small" bordered>
                <Descriptions.Item label="Device" span={3}>
                  {loadingDeviceSla ? <Spin size="small" /> : (deviceName || activeTicket.deviceId || "-")}
                </Descriptions.Item>
                <Descriptions.Item label="Company Assigned Device" span={3}>
                  {activeTicket.companyAssignedDevice || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Landmark">{activeTicket.landmark || "-"}</Descriptions.Item>
                <Descriptions.Item label="Exact Location">{activeTicket.exactLocation || "-"}</Descriptions.Item>
                <Descriptions.Item label="Latitude">{activeTicket.latitude ?? "-"}</Descriptions.Item>
                <Descriptions.Item label="Longitude">{activeTicket.longitude ?? "-"}</Descriptions.Item>
                <Descriptions.Item label="Alert ID">{activeTicket.alertId ?? "-"}</Descriptions.Item>
                <Descriptions.Item label="Work Order Template">{activeTicket.workOrderTemplateId ?? "-"}</Descriptions.Item>
              </Descriptions>
            </div>

            <div>
              <Divider orientation="left" style={{ fontSize: 13 }}>
                <CheckCircleOutlined /> SLA & Resolution
              </Divider>
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="SLA">
                  {loadingDeviceSla ? <Spin size="small" /> : (slaName || activeTicket.slaId || "-")}
                </Descriptions.Item>
                <Descriptions.Item label="Resolution">{activeTicket.resolution || "-"}</Descriptions.Item>
              </Descriptions>
            </div>

            {(() => {
              let tags = [];
              let customFields = {};
              try { tags = JSON.parse(activeTicket.tagsJson || "[]"); } catch { }
              try { customFields = JSON.parse(activeTicket.customFieldsJson || "{}"); } catch { }
              const hasCustomFields = customFields && Object.keys(customFields).length > 0;
              if (tags.length === 0 && !hasCustomFields) return null;
              return (
                <div>
                  <Divider orientation="left" style={{ fontSize: 13 }}>
                    <PaperClipOutlined /> Tags & Custom Fields
                  </Divider>
                  {tags.length > 0 && (
                    <div style={{ marginBottom: hasCustomFields ? 10 : 0 }}>
                      <Space size={[4, 4]} wrap>
                        {tags.map((tag, i) => <Tag key={i} color="blue">{tag}</Tag>)}
                      </Space>
                    </div>
                  )}
                  {hasCustomFields && (
                    <Descriptions column={3} size="small" bordered>
                      {Object.entries(customFields).map(([k, v]) => (
                        <Descriptions.Item key={k} label={k}>{String(v)}</Descriptions.Item>
                      ))}
                    </Descriptions>
                  )}
                </div>
              );
            })()}

            <div>
              <Divider orientation="left" style={{ fontSize: 13 }}>
                <PaperClipOutlined /> Attachments
              </Divider>
              <TicketAttachments ticketId={activeTicket.ticketId} authToken={authToken} />
            </div>
          </div>
        )}
      </Modal>

      {/* AUDIT POPUP */}
      <Modal
        title={
          <Space>
            <HistoryOutlined style={{ color: "#faad14" }} />
            <span>Audit Trail {auditTicketId ? `— Ticket #${auditTicketId}` : ""}</span>
          </Space>
        }
        open={showAuditModal}
        onCancel={closeAuditModal}
        footer={[<Button key="close" type="primary" onClick={closeAuditModal}>Close</Button>]}
        width={780}
        centered
        destroyOnClose
      >
        <div style={{ maxHeight: "65vh", overflowY: "auto", overflowX: "hidden", paddingRight: 4 }}>
          {auditLoading ? (
            <div style={{ textAlign: "center", padding: "30px 0" }}><Spin /></div>
          ) : auditData.length === 0 ? (
            <Empty description="No audit records found" />
          ) : (
            <div style={{ position: "relative", paddingLeft: 4 }}>
              {auditData.map((item, idx) => {
                const parseMaybeJson = (val) => {
                  if (val === null || val === undefined || val === "") return null;
                  if (typeof val === "object") return val;
                  try {
                    const parsed = JSON.parse(val);
                    return parsed && typeof parsed === "object" ? parsed : null;
                  } catch { return null; }
                };

                const oldObj = parseMaybeJson(item.oldValue);
                const newObj = parseMaybeJson(item.newValue);

                let fieldRows = [];
                if (oldObj || newObj) {
                  const allKeys = Array.from(new Set([
                    ...(oldObj ? Object.keys(oldObj) : []),
                    ...(newObj ? Object.keys(newObj) : []),
                  ]));
                  fieldRows = allKeys.map((key) => ({
                    field: key,
                    oldVal: oldObj ? oldObj[key] : undefined,
                    newVal: newObj ? newObj[key] : undefined,
                  }));
                } else if (item.oldValue || item.newValue) {
                  const fieldName = item.fieldName || item.field || item.column || item.propertyName || "Value";
                  fieldRows = [{ field: fieldName, oldVal: item.oldValue, newVal: item.newValue }];
                }

                const actionColor =
                  item.action === "Created" ? "green" :
                    item.action === "Updated" ? "blue" :
                      item.action === "Assigned" ? "purple" :
                        item.action === "Closed" ? "default" :
                          item.action === "Approved" ? "green" :
                            item.action === "Rejected" ? "red" : "gold";

                return (
                  <div key={item.id ?? idx} style={{ display: "flex", gap: 12, marginBottom: 18 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#1890ff", marginTop: 4, flexShrink: 0 }} />
                      {idx !== auditData.length - 1 && (
                        <div style={{ flex: 1, width: 2, backgroundColor: "#f0f0f0", marginTop: 2 }} />
                      )}
                    </div>

                    <div style={{ flex: 1, backgroundColor: "#fafafa", border: "1px solid #f0f0f0", borderRadius: 8, padding: "10px 14px", minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                        <Tag color={actionColor} style={{ margin: 0 }}>{item.action}</Tag>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {item.performedAt ? new Date(item.performedAt).toLocaleString() : "-"}
                        </Text>
                      </div>

                      <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 4 }}>
                        by {userLabel(item.performedBy)}
                      </Text>

                      {fieldRows.length > 0 && (
                        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                          {fieldRows.map((row, rIdx) => (
                            <div key={rIdx} style={{
                              display: "flex", alignItems: "center", gap: 10, padding: "6px 10px",
                              backgroundColor: "#fff", border: "1px solid #f0f0f0", borderRadius: 6, flexWrap: "wrap"
                            }}>
                              <Tag style={{ margin: 0, fontFamily: "monospace", minWidth: 100, textAlign: "center" }}>
                                {row.field}
                              </Tag>
                              {row.oldVal !== undefined && row.oldVal !== null && row.oldVal !== "" && (
                                <span style={{ backgroundColor: "#fff1f0", color: "#cf1322", padding: "2px 8px", borderRadius: 4, fontSize: 12, textDecoration: "line-through" }}>
                                  {String(row.oldVal)}
                                </span>
                              )}
                              {row.oldVal !== undefined && row.oldVal !== null && row.oldVal !== "" &&
                                row.newVal !== undefined && row.newVal !== null && row.newVal !== "" && (
                                  <span style={{ color: "#999", fontSize: 12 }}>→</span>
                                )}
                              {row.newVal !== undefined && row.newVal !== null && row.newVal !== "" && (
                                <span style={{ backgroundColor: "#f6ffed", color: "#389e0d", padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 500 }}>
                                  {String(row.newVal)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {item.notes && (
                        <Text style={{ fontSize: 12, display: "block", marginTop: 8, fontStyle: "italic", color: "#666" }}>
                          "{item.notes}"
                        </Text>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default TicketManagement;