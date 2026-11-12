import { useEffect, useState } from "react";
import { createPortal } from "react-dom";   // ← naya import
import {
    Button, Input, message, Table, Space, Switch,
    Typography, Row, Col, Tooltip, Badge
} from "antd";
import React from "react";
import axiosInstance from "../../config";
import { useNavigate } from "react-router-dom";
import {
    PlusOutlined, SearchOutlined, ArrowLeftOutlined,
    EditOutlined, CloseOutlined, CrownOutlined
} from "@ant-design/icons";

const { Title, Text } = Typography;

function CompanyRole({ onBack }) {
    const emptyForm = { name: "", description: "" };
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [data, setdata] = useState([]);
    const [loading, setloading] = useState(false);
    const [submitting, setsubmitting] = useState(false);
    const [statusLoadingId, setstatusLoadingId] = useState(null);

    const [editid, seteditid] = useState(null); // null = add mode
    const [formdata, setformdata] = useState(emptyForm);
    const [openmodel, setopenmodel] = useState(false);
    const [searchText, setSearchText] = useState("");

    const fetchCompanyRole = async (p = page, ps = pageSize, search = searchText) => {
        setloading(true);
        try {
            const res = await axiosInstance.get("/CompanyRole/get-all-companyrole", {
                params: {
                    Page: p,
                    PageSize: ps,
                    Search: search || "",
                    IsPaginated: true,
                },
            });

            console.log(res, "data loa");

            // ✅ res khud hi envelope hai — seedha use karo
            const list = res?.data || [];
            setdata(Array.isArray(list) ? list : []);
            setTotalRecords(res?.totalRecords || 0);
        } catch (error) {
            console.log("error", error);
            message.error("Failed to load company roles");
        } finally {
            setloading(false);
        }
    };

    useEffect(() => {
        fetchCompanyRole();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchCompanyRole(1, pageSize, searchText);
        }, 400); // debounce, taaki har keystroke pe API na chale

        return () => clearTimeout(timer);
    }, [searchText]);

    const openAddModel = () => {
        seteditid(null);
        setformdata(emptyForm);
        setopenmodel(true);
    };

    const openEditModel = (item) => {
        seteditid(item.id);
        setformdata({ name: item.name || "", description: item.description || "" });
        setopenmodel(true);
    };

    const closemodel = () => {
        setopenmodel(false);
        seteditid(null);
        setformdata(emptyForm);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setformdata((prev) => ({ ...prev, [name]: value }));
    };

    // ✅ FIXED: .put() use kiya, aur only isActive flip karke bhej rahe hain
    const StatusChange = async (item) => {
        setstatusLoadingId(item.id);
        const newStatus = !item.isActive;
        try {
            await axiosInstance.post(`/CompanyRole/update-companyrole/${item.id}`, {
                ...item,
                isActive: newStatus,
            });
            message.success(`Role marked as ${newStatus ? "Active" : "Inactive"}`);
            // local state update kar diya, poora refetch nahi karna pada
            setdata((prev) =>
                prev.map((d) => (d.id === item.id ? { ...d, isActive: newStatus } : d))
            );
        } catch (error) {
            console.log("status change error", error);
            message.error("Failed to update status");
        } finally {
            setstatusLoadingId(null);
        }
    };

    const handleSubmit = async () => {
        if (!formdata.name) {
            message.warning("Please enter role name");
            return;
        }
        setsubmitting(true);
        try {
            if (editid) {
                await axiosInstance.post(`/CompanyRole/update-companyrole/${editid}`, formdata);
                message.success("Company role updated");
            } else {
                await axiosInstance.post("/CompanyRole/add-companyrole", formdata);
                message.success("Company role added");
            }
            closemodel();
            fetchCompanyRole();
        } catch (error) {
            console.log("submit error", error);
            message.error("Something went wrong, please try again");
        } finally {
            setsubmitting(false);
        }
    };

    const filteredData = data.filter(
        (d) =>
            !searchText ||
            (d.name || "").toLowerCase().includes(searchText.toLowerCase()) ||
            (d.description || "").toLowerCase().includes(searchText.toLowerCase())
    );

    const columns = [
        {
            title: "ID", key: "id", width: 70,
            render: (_, __, index) => (
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>{index + 1}</span>
            ),
        },
        {
            title: "Name", dataIndex: "name", key: "name", width: 220,
            sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
            render: (t) => (
                <Space size={8}>
                    <div
                        style={{
                            width: 30, height: 30, borderRadius: 8,
                            background: "#EFF6FF", border: "1px solid #DBEAFE",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                    >
                        <CrownOutlined style={{ color: "#2563EB", fontSize: 14 }} />
                    </div>
                    <Text style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                        {t || "—"}
                    </Text>
                </Space>
            ),
        },
        {
            title: "Description", dataIndex: "description", key: "description", width: 330,
            render: (t) => <Text style={{ fontSize: 13, color: "#6B7280" }}>{t || "—"}</Text>,
        },
        {
            title: "Status", key: "isActive", width: 130,
            render: (_, item) => (
                <Space size={8}>
                    <Switch
                        checked={!!item.isActive}
                        loading={statusLoadingId === item.id}
                        onChange={() => StatusChange(item)}
                        style={{
                            backgroundColor: item.isActive ? "#16A34A" : "#DC2626",
                        }}
                    />
                    <Text style={{ fontSize: 12, color: item.isActive ? "#16A34A" : "#DC2626", fontWeight: 600 }}>
                        {item.isActive ? "Active" : "Inactive"}
                    </Text>
                </Space>
            ),
        },
        {
            title: "Actions", key: "actions", width: 100, fixed: "right",
            render: (_, item) => (
                <Tooltip title="Edit">
                    <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined style={{ fontSize: 16 }} />}
                        onClick={() => openEditModel(item)}
                        style={{ color: "#1890ff" }}
                    />
                </Tooltip>
            ),
        },
    ];

    const backdropStyle = {
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)", zIndex: 2000,   // zIndex thoda badha diya safety ke liye
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
    };

    // ── Modal ko alag JSX variable me nikal lo ──
    const modalContent = openmodel ? (
        <div style={backdropStyle} onClick={closemodel}>
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: "white",
                    padding: "28px 32px",
                    borderRadius: 14,
                    width: 420,
                    maxWidth: "94%",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <Title level={5} style={{ margin: 0, color: "#1890ff" }}>
                        {editid ? "Edit Role" : "Add New Role"}
                    </Title>
                    <Button type="text" icon={<CloseOutlined />} onClick={closemodel} style={{ color: "#666" }} />
                </div>

                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                        Role Name
                    </label>
                    <Input
                        name="name"
                        value={formdata.name}
                        onChange={handleChange}
                        placeholder="Enter company role"
                        size="large"
                    />
                </div>

                <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
                        Description
                    </label>
                    <Input
                        name="description"
                        value={formdata.description}
                        onChange={handleChange}
                        placeholder="Enter description"
                        size="large"
                    />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <Button size="large" onClick={closemodel}>Cancel</Button>
                    <Button type="primary" size="large" loading={submitting} onClick={handleSubmit}>
                        {editid ? "Update" : "Submit"}
                    </Button>
                </div>
            </div>
        </div>
    ) : null;

    return (
        <div style={{ minHeight: "100vh", background: "#F3F4F6", padding: "24px 20px" }}>

            {/* ── HEADER ── */}
            <div
                style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginBottom: 14, flexWrap: "wrap", gap: 10,
                    padding: "10px 4px",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 8, height: 20 }}>
                    <div
                        style={{
                            width: 30, height: 30, borderRadius: 8,
                            background: "#EFF6FF", border: "1px solid #DBEAFE",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        <CrownOutlined style={{ color: "#2563EB", fontSize: 14 }} />
                    </div>
                    <div>
                        <Title level={5} style={{ margin: 0, color: "#111827", lineHeight: 1.2 }}>
                            Company Roles
                        </Title>
                        <Text style={{ fontSize: 11, color: "#6B7280" }}>
                            Manage roles assignable to companies
                        </Text>
                    </div>
                </div>

                <Space size={8}>
                    <Button
                        size="middle"
                        icon={<ArrowLeftOutlined />}
                        onClick={onBack}   // ✅ navigate() hataya, ab parent state control karega
                        style={{ fontSize: 13, height: 32 }}
                    >
                        Back
                    </Button>
                    <Button
                        type="primary"
                        size="middle"
                        icon={<PlusOutlined />}
                        onClick={openAddModel}
                        style={{
                            background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                            border: "none", fontSize: 13, height: 32, paddingInline: 14,
                        }}
                    >
                        Add Role
                    </Button>
                </Space>
            </div>

            {/* ── SEARCH BAR ── */}
            <div
                style={{
                    background: "white", borderRadius: 8, padding: "8px 14px",
                    marginBottom: 14, boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
                }}
            >
                <Row gutter={16} align="middle">
                    <Col xs={24} sm={12} md={10}>
                        <Input
                            placeholder="Search by name or description..."
                            prefix={<SearchOutlined style={{ color: "#bbb", fontSize: 14 }} />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                            size="middle"
                            style={{ fontSize: 13 }}
                        />
                    </Col>
                    <Col xs={24} sm={12} md={14} style={{ textAlign: "right" }}>
                        <Text style={{ fontSize: 12, color: "#888" }}>
                            Showing {filteredData.length} of {data.length}
                        </Text>
                    </Col>
                </Row>
            </div>

            {/* ── TABLE CARD ── */}
            <div
                style={{
                    background: "white", borderRadius: 10,
                    boxShadow: "0 1px 6px rgba(0,0,0,0.08)", overflow: "hidden",
                }}
            >
                {/* <div
                    style={{
                        padding: "16px 22px", borderBottom: "1px solid #f0f0f0",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}
                >
                    <Text strong style={{ fontSize: 16 }}>Roles List</Text>
                    <Badge count={filteredData.length} style={{ backgroundColor: "#1890ff" }} />
                </div> */}
                <Table
                    dataSource={data}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    size="middle"
                    scroll={{ x: 900 }}
                    pagination={{
                        current: page,
                        pageSize: pageSize,
                        total: totalRecords,
                        showSizeChanger: true,
                        style: { padding: "12px 22px", margin: 0 },
                        pageSizeOptions: [10, 20, 50],
                        showTotal: (t) => `${t} Roles`,
                        onChange: (newPage, newPageSize) => {
                            setPage(newPage);
                            setPageSize(newPageSize);
                            fetchCompanyRole(newPage, newPageSize, searchText);
                        },
                    }}
                    locale={{
                        emptyText: (
                            <div style={{ padding: "24px 0", textAlign: "center", color: "#999" }}>
                                No Company Roles found
                            </div>
                        ),
                    }}
                />

            </div>

            {/* ── ADD / EDIT MODAL ── */}

            {createPortal(modalContent, document.body)}
        </div>
    );
}

export default CompanyRole;