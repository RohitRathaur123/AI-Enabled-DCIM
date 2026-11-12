import { useEffect, useState } from "react";
import { axiosdevice } from "../../config";
import { Alert, Badge, Button, Col, Input, message, Row, Space, Table, Tag, Tooltip, Typography, Select } from "antd";
import { ApiOutlined, EditOutlined, EyeOutlined, PlusOutlined, ReloadOutlined, SearchOutlined, CloseOutlined, DownloadOutlined } from "@ant-design/icons";
import React from "react";
import GenericImportModal from "./GenericImportFIle";
import ExcelExport from "../entity/excelexport";
const { Title, Text } = Typography;
const { Option } = Select;

const STATUS_OPTIONS = ["Connected", "Disconnected", "Faulty", "Planned"];
const CABLE_TYPE_OPTIONS = ["Cat5e", "Cat6", "Cat6a", "Fiber", "Coaxial"];

const Network_Connection_BACKEND_FIELDS = [
    { key: "sourceDeviceSerialNumber", label: "Source Device Serial Number", required: true, color: "red", hint: "e.g. SN-2024-001, source device identifier" },
    { key: "sourcePortName", label: "Source Port Name", required: true, color: "blue", hint: "e.g. Gi0/1, Port-A" },
    { key: "targetDeviceSerialNumber", label: "Target Device Serial Number", required: true, color: "purple", hint: "e.g. SN-2024-002, target device identifier" },
    { key: "targetPortName", label: "Target Port Name", required: true, color: "cyan", hint: "e.g. Gi0/2, Port-B" },
    { key: "cableType", label: "Cable Type", required: false, color: "orange", hint: "e.g. Fiber, Cat6, Copper" },
    { key: "cableColorCode", label: "Cable Color Code", required: false, color: "green", hint: "e.g. Blue, Red, Yellow" },
    { key: "cableLabel", label: "Cable Label", required: false, color: "magenta", hint: "e.g. CBL-001, Rack-A-01" },
    { key: "status", label: "Status", required: false, color: "default", hint: "e.g. Active, Inactive, Faulty" },
];

function NetworkConnection() {
    const emptyForm = {
        sourceDeviceDetailId: "",
        sourcePortName: "",
        targetDeviceDetailId: "",
        targetPortName: "",
        cableType: "",
        cableColorCode: "",
        cableLabel: "",
        status: ""
    };

    const [dataitems, setdataitems] = useState([]);
    const [formdata, setformdata] = useState(emptyForm);

    const [error, seterror] = useState("");
    const [showmodel, setshowmodel] = useState(false);
    const [editconfig, seteditconfig] = useState(null);
    const [loading, setloading] = useState(false);
    const [tableloading, settableloading] = useState(false);
    const [searchText, setSearchText] = useState("");

    const [devices, setdevices] = useState([]);
    const [devicesloading, setdevicesloading] = useState(false);
    const [devicesfetched, setdevicesfetched] = useState(false);

    // view modal
    const [viewmodel, setviewmodel] = useState(false);
    const [viewconfig, setviewconfig] = useState(null);
    const [viewloading, setviewloading] = useState(false);



    const [showExportModal, setShowExportModal] = useState(false)
    const [showImportModal, setShowImportModal] = useState(false);

    const fetchConnections = async () => {
        settableloading(true);
        try {
            const res = await axiosdevice.get("/NetworkConnection/get-all-network-connections", {
                params: {
                    SourceDeviceDetailId: "",
                    TargetDeviceDetailId: "",
                    DeviceDetailId: "",
                    Status: "",
                    CableType: "",
                    Page: 1,
                    PageSize: 100,
                    Search: "",
                    IsPaginated: false
                }
            });
            const list = res?.data?.data || res?.data?.items || res?.data || res || [];
            setdataitems(Array.isArray(list) ? list : []);
        } catch (error) {
            console.log("error in getting network connections", error);
            seterror("Failed to load network connections");
        } finally {
            settableloading(false);
        }
    };

    // Fetch devices only once, when the dropdown is opened for the first time
    const fetchDevices = async () => {
        if (devicesfetched) return;
        setdevicesloading(true);
        try {
            const res = await axiosdevice.get("/devicedetail/get-all-devicedetail");
            const list = res?.data?.data || res?.data?.items || res?.data || res || [];
            setdevices(Array.isArray(list) ? list : []);
            setdevicesfetched(true);
        } catch (error) {
            console.log("error fetching devices", error);
            message.error("Failed to load devices");
        } finally {
            setdevicesloading(false);
        }
    };

    const handleDeviceDropdownOpen = (open) => {
        if (open) {
            fetchDevices();
        }
    };

    useEffect(() => {
        fetchConnections();
    }, []);

    const openAddModal = () => {
        seteditconfig(null);
        setformdata(emptyForm);
        setshowmodel(true);
    };

    const openEditModal = async (record) => {
        seteditconfig(record);
        setshowmodel(true);
        try {
            const res = await axiosdevice.get(`/NetworkConnection/${record.id}/get-network-connection`);
            const data = res?.data?.data || res?.data || res || {};
            setformdata({
                sourceDeviceDetailId: data.sourceDeviceDetailId || "",
                sourcePortName: data.sourcePortName || "",
                targetDeviceDetailId: data.targetDeviceDetailId || "",
                targetPortName: data.targetPortName || "",
                cableType: data.cableType || "",
                cableColorCode: data.cableColorCode || "",
                cableLabel: data.cableLabel || "",
                status: data.status || ""
            });
        } catch (error) {
            console.log("error loading record", error);
            message.error("Unable to load record");
            setshowmodel(false);
        }
    };

    const openViewModel = async (record) => {
        setviewmodel(true);
        setviewloading(true);
        setviewconfig(null);
        try {
            const res = await axiosdevice.get(`/NetworkConnection/${record.id}/get-network-connection`);
            const data = res?.data?.data || res?.data || res || null;
            setviewconfig(data);
        } catch (error) {
            console.log("error in getting network connection", error);
            message.error("Failed to load connection details");
            setviewmodel(false);
        } finally {
            setviewloading(false);
        }
    };

    const closeViewModel = () => {
        setviewmodel(false);
        setviewconfig(null);
    };

    const closeModal = () => setshowmodel(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setformdata((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSelectChange = (name, value) => {
        setformdata((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        if (!formdata.sourceDeviceDetailId || !formdata.targetDeviceDetailId || !formdata.sourcePortName || !formdata.targetPortName) {
            message.warning("Please fill in Source Device, Target Device, Source Port and Target Port");
            return;
        }
        setloading(true);
        try {
            const payload = {
                sourceDeviceDetailId: formdata.sourceDeviceDetailId,
                sourcePortName: formdata.sourcePortName,
                targetDeviceDetailId: formdata.targetDeviceDetailId,
                targetPortName: formdata.targetPortName,
                cableType: formdata.cableType,
                cableColorCode: formdata.cableColorCode,
                cableLabel: formdata.cableLabel,
                status: formdata.status
            };

            if (editconfig) {
                await axiosdevice.post(`/NetworkConnection/${editconfig.id}/update-network-connection`, payload);
                message.success("Network connection updated successfully");
            } else {
                await axiosdevice.post("/NetworkConnection/add-network-connection", payload);
                message.success("Network connection created successfully");
            }
            closeModal();
            fetchConnections();
        } catch (error) {
            console.log(error, "error in submit");
            message.error("Something went wrong, please try again");
        } finally {
            setloading(false);
        }
    };

    const getDeviceName = (id) => {
        const d = devices.find((x) => x.id === id);
        return d ? (d.shortName || d.deviceName || d.name || id) : id;
    };

    const filteredData = dataitems.filter((s) =>
        !searchText ||
        (s.cableLabel || "").toLowerCase().includes(searchText.toLowerCase()) ||
        (s.cableType || "").toLowerCase().includes(searchText.toLowerCase()) ||
        (s.sourcePortName || "").toLowerCase().includes(searchText.toLowerCase()) ||
        (s.targetPortName || "").toLowerCase().includes(searchText.toLowerCase())
    );

    const backdropStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000 };
    const totalconnections = dataitems.length;

    const statusColor = (val) => {
        switch (val) {
            case "Connected": return "green";
            case "Disconnected": return "default";
            case "Faulty": return "red";
            case "Planned": return "blue";
            default: return "default";
        }
    };

    const columns = [
        {
            title: "#", key: "index", width: 60,
            render: (text, record, index) => index + 1
        },
        {
            title: "Source Port", dataIndex: "sourcePortName", key: "sourcePortName", width: 160,
            // sorter: (a, b) => (a.sourcePortName || "").localeCompare(b.sourcePortName || ""),
            sorter: (a, b) => (Number(a.sourcePortName) || 0) - (Number(b.sourcePortName) || 0),
            render: (text) => (
                <Space size={8}>
                    <ApiOutlined style={{ color: "#1890ff", fontSize: 16 }} />
                    <Text style={{ fontSize: 15 }}>{text || "-"}</Text>
                </Space>
            ),
        },
        {
            title: "Target Port", dataIndex: "targetPortName", key: "targetPortName", width: 160,
            render: (text) => <Text style={{ fontSize: 15 }}>{text || "-"}</Text>,
        },
        {
            title: "Cable Type", dataIndex: "cableType", key: "cableType", width: 130,
            sorter: (a, b) => (a.cableType || "").localeCompare(b.cableType || ""),
            render: (text) => <Text style={{ fontSize: 15 }}>{text || "-"}</Text>,
        },
        {
            title: "Cable Color", dataIndex: "cableColorCode", key: "cableColorCode", width: 130,
            render: (text) => <Text style={{ fontSize: 15 }}>{text || "-"}</Text>,
        },
        {
            title: "Cable Label", dataIndex: "cableLabel", key: "cableLabel", width: 160,
            render: (text) => <Text style={{ fontSize: 15 }}>{text || "-"}</Text>,
        },
        {
            title: "Status", dataIndex: "status", key: "status", width: 130,
            render: (val) => <Tag color={statusColor(val)} style={{ fontSize: 13 }}>{val || "-"}</Tag>,
        },
        {
            title: "Actions", key: "actions", width: 120, fixed: "right",
            render: (_, record) => (
                <Space size={6}>
                    <Tooltip title="View">
                        <Button type="text" size="middle" icon={<EyeOutlined style={{ fontSize: 18 }} />} onClick={() => openViewModel(record)} style={{ color: "#52c41a" }} />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button type="text" size="middle" icon={<EditOutlined style={{ fontSize: 18 }} />} onClick={() => openEditModal(record)} style={{ color: "#1890ff" }} />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f0f2f5", padding: "20px 12px", boxSizing: "border-box" }}>

            {/* HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexShrink: 0 }}>
                <div>
                    <Title level={4} style={{ margin: 0, lineHeight: 1.3 }}>
                        <ApiOutlined style={{ marginRight: 8, color: "#1890ff" }} />
                        Network Connection
                    </Title>
                </div>
                <Space size={8}>
                    <Button onClick={() => setShowImportModal(true)}>Import File</Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal} size="middle"
                        style={{ background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)", border: "none", fontSize: 13, height: 32, paddingInline: 14 }}>
                        Add Connection
                    </Button>
                    <Button icon={<DownloadOutlined />} onClick={() => setShowExportModal(true)}>
                        Export
                    </Button>
                    <ExcelExport
                        open={showExportModal}
                        onClose={() => setShowExportModal(false)}
                        searchText={searchText}          // ✅ current search filter bhi pass ho jayega export mein
                        apiUrl="/NetworkConnection/export"
                        fileNamePrefix="NetworkConnection"
                    />
                    <Button icon={<ReloadOutlined />} size="middle" onClick={fetchConnections} style={{ fontSize: 13, height: 32, paddingInline: 14 }}>Refresh</Button>
                </Space>
            </div>

            {error && <Alert message={error} type="error" showIcon closable onClose={() => seterror(null)} style={{ marginBottom: 14, padding: "10px 16px", fontSize: 14 }} />}

            {/* SEARCH */}
            <div style={{ backgroundColor: "white", borderRadius: 10, padding: "16px 20px", marginBottom: 16, flexShrink: 0, boxShadow: "0 1px 6px rgba(0,0,0,0.08)" }}>
                <Row gutter={16} align="middle">
                    <Col xs={24} sm={12} md={10}>
                        <Input
                            placeholder="Search by port, cable type or label..."
                            prefix={<SearchOutlined style={{ color: "#bbb", fontSize: 16 }} />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                            size="large"
                            style={{ fontSize: 15 }}
                        />
                    </Col>
                    <Col xs={24} sm={12} md={14} style={{ textAlign: "right" }}>
                        <Text style={{ fontSize: 15, color: "#888" }}>Showing {filteredData.length} of {totalconnections}</Text>
                    </Col>
                </Row>
            </div>

            {/* TABLE */}
            <div style={{ flex: 1, backgroundColor: "white", borderRadius: 10, boxShadow: "0 1px 6px rgba(0,0,0,0.08)", overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
                <div style={{ padding: "16px 22px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                    <Text strong style={{ fontSize: 18 }}>Network Connections</Text>
                    <Badge count={filteredData.length} style={{ backgroundColor: "#1890ff", fontSize: 13 }} />
                </div>
                <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
                    <Table
                        columns={columns} dataSource={filteredData} loading={tableloading}
                        bordered={false} rowKey="id" size="middle"
                        scroll={{ x: 1100 }}
                        pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (total) => `${total} Connections`, style: { padding: "12px 22px", margin: 0 } }}
                        style={{ fontSize: 15 }}
                        locale={{ emptyText: <div style={{ padding: "24px 0", textAlign: "center", color: "#999", fontSize: 16 }}>No Network Connection found</div> }}
                    />
                </div>
            </div>


            {/* ADD / EDIT MODAL */}
            {showmodel && (
                <div style={backdropStyle} onClick={closeModal}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "white", padding: "28px 32px", borderRadius: 14, width: "600px", maxWidth: "96%", zIndex: 1001, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto" }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                            <h3 style={{ margin: 0, color: "#1890ff", fontSize: 22 }}>
                                {editconfig ? "Edit Network Connection" : "Create New Network Connection"}
                            </h3>
                            <Button type="text" icon={<CloseOutlined style={{ fontSize: 20 }} />} onClick={closeModal} style={{ color: "#666" }} />
                        </div>

                        <Row gutter={16} style={{ marginBottom: 18 }}>
                            <Col span={12}>
                                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 15 }}>
                                    Source Device
                                </label>
                                <Select
                                    showSearch
                                    placeholder="Select source device"
                                    size="large"
                                    style={{ width: "100%", fontSize: 15 }}
                                    value={formdata.sourceDeviceDetailId || undefined}
                                    loading={devicesloading}
                                    onDropdownVisibleChange={handleDeviceDropdownOpen}
                                    onChange={(val) => handleSelectChange("sourceDeviceDetailId", val)}
                                    notFoundContent={devicesloading ? "Loading..." : "No devices found"}
                                    filterOption={(input, option) =>
                                        (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
                                    }
                                >
                                    {devices.map((d) => (
                                        <Option key={d.id} value={d.id}>
                                            {d.shortName || d.deviceName || d.name || d.id}
                                        </Option>
                                    ))}
                                </Select>
                            </Col>
                            <Col span={12}>
                                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 15 }}>
                                    Source Port
                                </label>
                                <Input name="sourcePortName" value={formdata.sourcePortName} onChange={handleInputChange} placeholder="e.g. Gi0/1" size="large" style={{ fontSize: 15 }} />
                            </Col>
                        </Row>

                        <Row gutter={16} style={{ marginBottom: 18 }}>
                            <Col span={12}>
                                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 15 }}>
                                    Target Device
                                </label>
                                <Select
                                    showSearch
                                    placeholder="Select target device"
                                    size="large"
                                    style={{ width: "100%", fontSize: 15 }}
                                    value={formdata.targetDeviceDetailId || undefined}
                                    loading={devicesloading}
                                    onDropdownVisibleChange={handleDeviceDropdownOpen}
                                    onChange={(val) => handleSelectChange("targetDeviceDetailId", val)}
                                    notFoundContent={devicesloading ? "Loading..." : "No devices found"}
                                    filterOption={(input, option) =>
                                        (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
                                    }
                                >
                                    {devices.map((d) => (
                                        <Option key={d.id} value={d.id}>
                                            {d.shortName || d.deviceName || d.name || d.id}
                                        </Option>
                                    ))}
                                </Select>
                            </Col>
                            <Col span={12}>
                                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 15 }}>
                                    Target Port
                                </label>
                                <Input name="targetPortName" value={formdata.targetPortName} onChange={handleInputChange} placeholder="e.g. Fa0/3" size="large" style={{ fontSize: 15 }} />
                            </Col>
                        </Row>

                        <Row gutter={16} style={{ marginBottom: 18 }}>
                            <Col span={12}>
                                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 15 }}>
                                    Cable Type
                                </label>
                                <Select
                                    showSearch
                                    allowClear
                                    placeholder="Select cable type"
                                    size="large"
                                    style={{ width: "100%", fontSize: 15 }}
                                    value={formdata.cableType || undefined}
                                    onChange={(val) => handleSelectChange("cableType", val)}
                                    filterOption={(input, option) =>
                                        (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
                                    }
                                >
                                    {CABLE_TYPE_OPTIONS.map((c) => (
                                        <Option key={c} value={c}>{c}</Option>
                                    ))}
                                </Select>
                            </Col>
                            <Col span={12}>
                                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 15 }}>
                                    Cable Color
                                </label>
                                <Input name="cableColorCode" value={formdata.cableColorCode} onChange={handleInputChange} placeholder="e.g. Blue" size="large" style={{ fontSize: 15 }} />
                            </Col>
                        </Row>

                        <Row gutter={16} style={{ marginBottom: 18 }}>
                            <Col span={12}>
                                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 15 }}>
                                    Cable Label
                                </label>
                                <Input name="cableLabel" value={formdata.cableLabel} onChange={handleInputChange} placeholder="e.g. RACK1-SW1-P1" size="large" style={{ fontSize: 15 }} />
                            </Col>
                            <Col span={12}>
                                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 15 }}>
                                    Status
                                </label>
                                <Select
                                    placeholder="Select status"
                                    size="large"
                                    style={{ width: "100%", fontSize: 15 }}
                                    value={formdata.status || undefined}
                                    onChange={(val) => handleSelectChange("status", val)}
                                >
                                    {STATUS_OPTIONS.map((s) => (
                                        <Option key={s} value={s}>{s}</Option>
                                    ))}
                                </Select>
                            </Col>
                        </Row>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 22 }}>
                            <Button onClick={closeModal} size="large" style={{ fontSize: 15, height: 44, paddingInline: 20 }}>Cancel</Button>
                            <Button
                                type="primary"
                                onClick={handleSubmit}
                                loading={loading}
                                icon={editconfig ? <EditOutlined /> : <PlusOutlined />}
                                size="large"
                                style={{ fontSize: 15, height: 44, paddingInline: 20 }}
                            >
                                {loading ? "Saving..." : (editconfig ? "Update Connection" : "Create Connection")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW MODAL */}
            {viewmodel && (
                <div style={backdropStyle} onClick={closeViewModel}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "white", padding: "28px 32px", borderRadius: 14, width: "560px", maxWidth: "96%", zIndex: 1001, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto" }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                            <h3 style={{ margin: 0, color: "#1890ff", fontSize: 22 }}>
                                Network Connection Details
                            </h3>
                            <Button type="text" icon={<CloseOutlined style={{ fontSize: 20 }} />} onClick={closeViewModel} style={{ color: "#666" }} />
                        </div>

                        {viewloading ? (
                            <div style={{ textAlign: "center", padding: "30px 0", fontSize: 15, color: "#999" }}>Loading...</div>
                        ) : viewconfig ? (
                            <Row gutter={[16, 16]}>
                                <Col span={12}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Source Device</Text>
                                    <div style={{ fontSize: 15, fontWeight: 500 }}>{viewconfig.sourceDeviceShortName || getDeviceName(viewconfig.sourceDeviceDetailId) || "-"}</div>
                                </Col>
                                <Col span={12}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Source Port</Text>
                                    <div style={{ fontSize: 15, fontWeight: 500 }}>{viewconfig.sourcePortName || "-"}</div>
                                </Col>
                                <Col span={12}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Target Device</Text>
                                    <div style={{ fontSize: 15, fontWeight: 500 }}>{viewconfig.targetDeviceShortName || getDeviceName(viewconfig.targetDeviceDetailId) || "-"}</div>
                                </Col>
                                <Col span={12}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Target Port</Text>
                                    <div style={{ fontSize: 15, fontWeight: 500 }}>{viewconfig.targetPortName || "-"}</div>
                                </Col>
                                <Col span={12}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Cable Type</Text>
                                    <div style={{ fontSize: 15, fontWeight: 500 }}>{viewconfig.cableType || "-"}</div>
                                </Col>
                                <Col span={12}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Cable Color</Text>
                                    <div style={{ fontSize: 15, fontWeight: 500 }}>{viewconfig.cableColorCode || "-"}</div>
                                </Col>
                                <Col span={12}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Cable Label</Text>
                                    <div style={{ fontSize: 15, fontWeight: 500 }}>{viewconfig.cableLabel || "-"}</div>
                                </Col>
                                <Col span={12}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Status</Text>
                                    <div style={{ fontSize: 15, fontWeight: 500 }}>
                                        <Tag color={statusColor(viewconfig.status)}>{viewconfig.status || "-"}</Tag>
                                    </div>
                                </Col>
                            </Row>
                        ) : (
                            <div style={{ textAlign: "center", padding: "30px 0", fontSize: 15, color: "#999" }}>No data found</div>
                        )}

                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
                            <Button onClick={closeViewModel} size="large" style={{ fontSize: 15, height: 44, paddingInline: 20 }}>Close</Button>
                        </div>
                    </div>
                </div>
            )}


            <GenericImportModal
                open={showImportModal}
                onCancel={() => setShowImportModal(false)}
                onImportSuccess={fetchConnections}
                entityName="network connection"
                apiEndpoint="/NetworkConnection/import"
                backendFields={Network_Connection_BACKEND_FIELDS}
            />
        </div>
    );
}

export default NetworkConnection;