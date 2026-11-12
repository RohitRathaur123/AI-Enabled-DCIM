import { useEffect, useState } from "react";
import { axiosdevice } from "../../config";
import { Alert, Badge, Button, Col, Input, InputNumber, message, Row, Space, Table, Tooltip, Typography, Select, Switch } from "antd";
import { EditOutlined, FieldTimeOutlined, PlusOutlined, ReloadOutlined, SearchOutlined, ThunderboltOutlined, CloseOutlined, EyeOutlined, DownloadOutlined } from "@ant-design/icons";
import React from "react";
import GenericImportModal from "./GenericImportFIle";
import ExcelExport from "../entity/excelexport";
const { Title, Text } = Typography;
const { Option } = Select;


const DeviceConConfig_BACKEND_FIELDS = [
    { key: "deviceSerialNumber", label: "Device Serial Number", required: true, color: "red", hint: "e.g. SN-2024-001, unique device identifier" },
    { key: "protocol", label: "Protocol", required: true, color: "blue", hint: "e.g. TCP/IP, Modbus, BACnet, SNMP" },
    { key: "ipAddress", label: "IP Address", required: false, color: "purple", hint: "e.g. 192.168.1.10" },
    { key: "port", label: "Port", required: false, color: "cyan", hint: "e.g. 502, 161, 8080" },
    { key: "objectId", label: "Object Id", required: false, color: "orange", hint: "Protocol-specific object identifier (BACnet/OPC)" },
    { key: "unitId", label: "Unit Id", required: false, color: "green", hint: "e.g. Modbus slave/unit ID" },
    { key: "pollingIntervalSeconds", label: "Polling Interval (Seconds)", required: false, color: "magenta", hint: "e.g. 30, 60, 300" },
    { key: "thingsBoardDeviceId", label: "ThingsBoard Device Id", required: false, color: "default", hint: "Corresponding device ID in ThingsBoard" },
];

function DeviceConnectionConfig() {
    const [dataitems, setdataitems] = useState([]);

    const emptyForm = {
        deviceDetailId: "",
        protocol: "",
        ipAddress: "",
        port: null,
        objectId: "",
        unitId: "",
        pollingIntervalSeconds: null,
        thingsBoardDeviceId: "",
        isActive: true
    };

    const [formdata, setformdata] = useState(emptyForm);

    const [error, seterror] = useState("");
    const [showmodel, setshowmodel] = useState(false);
    const [editconfig, seteditconfig] = useState(null);
    const [loading, setloading] = useState(false);
    const [tableloading, settableloading] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [devicedetail, setdevicedetail] = useState([]);
    const [devicedetailloading, setdevicedetailloading] = useState(false);
    const [devicedetailfetched, setdevicedetailfetched] = useState(false);
    //////////device connection config details
    const [viewmodel, setviewmodel] = useState(false);
    const [viewconfig, setviewconfig] = useState(null);
    const [viewloading, setviewloading] = useState(false);

    /////////////
    const [unit, setunit] = useState([])


    const [showExportModal, setShowExportModal] = useState(false)
    const [showImportModal, setShowImportModal] = useState(false);



    const fetchUnitmaster = async () => {
        try {
            const res = await axiosdevice.get("/unitmaster/get-all-units")
            const list = Array.isArray(res) ? res : (res?.data?.data || res?.data?.items || res?.data || []);
            setunit(Array.isArray(list) ? list : []);
        } catch (error) {
            console.log(error)
            setunit([]); // fallback taaki map crash na ho
        }
    }

    const fetchconfigdata = async () => {
        settableloading(true);
        try {
            const res = await axiosdevice.get("/DeviceConnectionConfig/get-all-device-connection-configs", {
                params: {
                    DeviceDetailId: "",
                    Protocol: "",
                    IsActive: null,
                    Page: 1,
                    PageSize: 100,
                    Search: "",
                    IsPaginated: false
                }
            });
            // const list = res.data?.data || res.data?.items || res.data || [];
            const list = Array.isArray(res) ? res : (res?.data || [])
            setdataitems(Array.isArray(list) ? list : []);
        } catch (error) {
            console.log("error in getting device connection configs", error);
            seterror("Failed to load device connection configs");
        } finally {
            settableloading(false);
        }
    };

    // Fetch device details only once, when the dropdown is opened for the first time
    const fetchDeviceDetail = async () => {
        if (devicedetailfetched) return;

        setdevicedetailloading(true);

        try {
            const res = await axiosdevice.get("/devicedetail/get-all-devicedetail");

            console.log("FULL RESPONSE:", res);

            // res khud hi array hai (interceptor already unwrap kar chuka hai)
            const list = Array.isArray(res)
                ? res
                : (res?.data || res?.items || []);

            console.log("FINAL DEVICE LIST:", list);

            setdevicedetail(Array.isArray(list) ? list : []);
            setdevicedetailfetched(true);

        } catch (error) {
            console.log("DEVICE API ERROR:", error);
            message.error("Failed to load device details");
        } finally {
            setdevicedetailloading(false);
        }
    };

    const openViewModel = async (record) => {
        setviewmodel(true);
        setviewloading(true);
        setviewconfig(null);
        try {
            const res = await axiosdevice.get(`/DeviceConnectionConfig/${record.id}/get-device-connection-config`);
            setviewconfig(res?.data ?? res);   // agar res.data undefined hai to seedha res use karo
        } catch (error) {
            console.log("error in getting device connection config", error);
            message.error("Failed to load config details");
            setviewmodel(false);
        } finally {
            setviewloading(false);
        }
    };

    const closeViewModel = () => {
        setviewmodel(false);
        setviewconfig(null);
    };
    // Called every time dropdown opens/closes
    const handleDeviceDropdownOpen = (open) => {
        if (open) {
            fetchDeviceDetail();
        }
    };

    const handleunitDropdownOpen = (openunit) => {
        if (openunit) {
            fetchUnitmaster()
        }
    }

    useEffect(() => {
        fetchconfigdata();
        // fetchDeviceDetail();
    }, []);

    const openAddModal = () => {
        seteditconfig(null);
        setformdata(emptyForm);
        setshowmodel(true);
    };

    const editOpenModel = (configdata) => {
        seteditconfig(configdata);
        setformdata({
            deviceDetailId: configdata.deviceDetailId || "",
            protocol: configdata.protocol || "",
            ipAddress: configdata.ipAddress || "",
            port: configdata.port ?? null,
            objectId: configdata.objectId || "",
            unitId: configdata.unitId || "",
            pollingIntervalSeconds: configdata.pollingIntervalSeconds ?? null,
            thingsBoardDeviceId: configdata.thingsBoardDeviceId || "",
            isActive: configdata.isActive ?? true
        });
        setshowmodel(true);
    };

    const closeModal = () => setshowmodel(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setformdata((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleNumberChange = (name, value) => {
        setformdata((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        if (!formdata.deviceDetailId || !formdata.protocol || !formdata.ipAddress) {
            message.warning("Please fill in Device Detail Id, Protocol and IP Address");
            return;
        }
        setloading(true);
        try {
            if (editconfig) {
                await axiosdevice.post(`/DeviceConnectionConfig/${editconfig.id}/update-device-connection-config`, {
                    deviceDetailId: formdata.deviceDetailId,
                    protocol: formdata.protocol,
                    ipAddress: formdata.ipAddress,
                    port: formdata.port,
                    objectId: formdata.objectId,
                    unitId: formdata.unitId,
                    pollingIntervalSeconds: formdata.pollingIntervalSeconds,
                    thingsBoardDeviceId: formdata.thingsBoardDeviceId,
                    isActive: formdata.isActive
                });
                message.success("Device connection config updated successfully");
            } else {
                await axiosdevice.post("/DeviceConnectionConfig/add-device-connection-config", {
                    deviceDetailId: formdata.deviceDetailId,
                    protocol: formdata.protocol,
                    ipAddress: formdata.ipAddress,
                    port: formdata.port,
                    objectId: formdata.objectId,
                    unitId: formdata.unitId,
                    pollingIntervalSeconds: formdata.pollingIntervalSeconds,
                    thingsBoardDeviceId: formdata.thingsBoardDeviceId
                });
                message.success("Device connection config created successfully");
            }
            closeModal();
            fetchconfigdata();
        } catch (error) {
            console.log(error, "error in submit");
            message.error("Something went wrong, please try again");
        } finally {
            setloading(false);
        }
    };

    const filteredData = dataitems.filter((s) =>
        !searchText ||
        (s.protocol || "").toLowerCase().includes(searchText.toLowerCase()) ||
        (s.ipAddress || "").toLowerCase().includes(searchText.toLowerCase())
    );

    const backdropStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000 };
    const totalconfigs = dataitems.length;

    const columns = [
        {
            title: "ID", dataIndex: "id", key: "id", width: 70,
            render: (text, record, index) => index + 1
        },
        {
            title: "Protocol", dataIndex: "protocol", key: "protocol", width: 140,
            // sorter: (a, b) => (a.protocol || "").localeCompare(b.protocol || ""),
            sorter: (a, b) => (Number(a.protocol) || 0) - (Number(b.protocol) || 0),
            render: (text) => (
                <Space size={8}>
                    <ThunderboltOutlined style={{ color: "#1890ff", fontSize: 16 }} />
                    <Text style={{ fontSize: 15 }}>{text}</Text>
                </Space>
            ),
        },
        {
            title: "IP Address", dataIndex: "ipAddress", key: "ipAddress", width: 180,
            render: (text) => <Text style={{ fontSize: 15 }}>{text}</Text>,
        },
        {
            title: "Port", dataIndex: "port", key: "port", width: 100,
            render: (text) => <Text style={{ fontSize: 15 }}>{text}</Text>,
        },
        // {
        //     title: "Object Id", dataIndex: "objectId", key: "objectId", width: 160,
        //     render: (text) => <Text style={{ fontSize: 15 }}>{text}</Text>,
        // },
        // {
        //     title: "Unit Id", dataIndex: "unitId", key: "unitId", width: 120,
        //     render: (text) => <Text style={{ fontSize: 15 }}>{text}</Text>,
        // },
        {
            title: "Polling Interval (s)", dataIndex: "pollingIntervalSeconds", key: "pollingIntervalSeconds", width: 170,
            // sorter: (a, b) => (a.pollingIntervalSeconds || "").localeCompare(b.pollingIntervalSeconds || ""),
            sorter: (a, b) => (Number(a.pollingIntervalSeconds) || 0) - (Number(b.pollingIntervalSeconds) || 0),
            render: (text) => <Text style={{ fontSize: 15 }}>{text}</Text>,
        },
        {
            title: "ThingsBoard Device Id", dataIndex: "thingsBoardDeviceId", key: "thingsBoardDeviceId", width: 220,
            render: (text) => <Text style={{ fontSize: 15 }}>{text}</Text>,
        },
        // {
        //     title: "Active", dataIndex: "isActive", key: "isActive", width: 100,
        //     render: (val) => (
        //         <Badge status={val ? "success" : "default"} text={val ? "Active" : "Inactive"} style={{ fontSize: 14 }} />
        //     ),
        // },
        {
            title: "Actions", key: "actions", width: 160, fixed: "right",
            render: (_, record) => (
                <Space size={6}>
                    <Tooltip title="View">
                        <Button type="text" size="middle" icon={<EyeOutlined style={{ fontSize: 18 }} />} onClick={() => openViewModel(record)} style={{ color: "#52c41a" }} />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button type="text" size="middle" icon={<EditOutlined style={{ fontSize: 18 }} />} onClick={() => editOpenModel(record)} style={{ color: "#1890ff" }} />
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
                        <FieldTimeOutlined style={{ marginRight: 8, color: "#1890ff" }} />
                        Device Connection Config
                    </Title>
                </div>
                <Space size={8}>
                    <Button onClick={() => setShowImportModal(true)}>Import File</Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal} size="middle"
                        style={{ background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)", border: "none", fontSize: 13, height: 32, paddingInline: 14 }}>
                        Create Config
                    </Button>
                    <Button icon={<DownloadOutlined />} onClick={() => setShowExportModal(true)}>
                        Export
                    </Button>
                    <ExcelExport
                        open={showExportModal}
                        onClose={() => setShowExportModal(false)}
                        searchText={searchText}          // ✅ current search filter bhi pass ho jayega export mein
                        apiUrl="/DeviceConnectionConfig/export"
                        fileNamePrefix="DeviceConnectionConfig"
                    />
                    <Button icon={<ReloadOutlined />} size="middle" onClick={fetchconfigdata} style={{ fontSize: 13, height: 32, paddingInline: 14 }}>Refresh</Button>
                </Space>
            </div>

            {error && <Alert message={error} type="error" showIcon closable onClose={() => seterror(null)} style={{ marginBottom: 14, padding: "10px 16px", fontSize: 14 }} />}

            {/* SEARCH */}
            <div style={{ backgroundColor: "white", borderRadius: 10, padding: "12px 16px", marginBottom: 16, flexShrink: 0, boxShadow: "0 1px 6px rgba(0,0,0,0.08)" }}>
                <Row gutter={16} align="middle">
                    <Col xs={24} sm={12} md={10}>
                        <Input
                            placeholder="Search by protocol or IP address..."
                            prefix={<SearchOutlined style={{ color: "#bbb", fontSize: 16 }} />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                            size="large"
                            style={{ fontSize: 15 }}
                        />
                    </Col>
                    <Col xs={24} sm={12} md={14} style={{ textAlign: "right" }}>
                        <Text style={{ fontSize: 15, color: "#888" }}>Showing {filteredData.length} of {totalconfigs}</Text>
                    </Col>
                </Row>
            </div>

            {/* TABLE */}
            <div style={{ flex: 1, backgroundColor: "white", borderRadius: 10, boxShadow: "0 1px 6px rgba(0,0,0,0.08)", overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
                <div style={{ padding: "16px 22px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                    <Text strong style={{ fontSize: 18 }}>Device Connection Configs</Text>
                    <Badge count={filteredData.length} style={{ backgroundColor: "#1890ff", fontSize: 13 }} />
                </div>
                <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
                    <Table
                        columns={columns} dataSource={filteredData} loading={tableloading}
                        bordered={false} rowKey="id" size="middle"
                        scroll={{ x: 1200 }}
                        pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (total) => `${total} Configs`, style: { padding: "12px 22px", margin: 0 } }}
                        style={{ fontSize: 15 }}
                        locale={{ emptyText: <div style={{ padding: "24px 0", textAlign: "center", color: "#999", fontSize: 16 }}>No Device Connection Config found</div> }}
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
                                {editconfig ? `Edit Config: ${editconfig.protocol}` : "Create New Device Connection Config"}
                            </h3>
                            <Button type="text" icon={<CloseOutlined style={{ fontSize: 20 }} />} onClick={closeModal} style={{ color: "#666" }} />
                        </div>

                        <Row gutter={12} style={{ marginBottom: 18 }}>
                            <Col span={24}>
                                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 15 }}>
                                    Device Detail
                                </label>
                                <Select
                                    showSearch
                                    placeholder="Select a device"
                                    size="large"
                                    style={{ width: "100%", fontSize: 15 }}
                                    value={formdata.deviceDetailId || undefined}
                                    loading={devicedetailloading}
                                    onDropdownVisibleChange={handleDeviceDropdownOpen}
                                    onChange={(val) =>
                                        handleNumberChange("deviceDetailId", val)
                                    }
                                    notFoundContent={
                                        devicedetailloading
                                            ? "Loading..."
                                            : "No devices found"
                                    }
                                    filterOption={(input, option) =>
                                        String(option?.children ?? "")
                                            .toLowerCase()
                                            .includes(input.toLowerCase())
                                    }
                                >
                                    {devicedetail.map((d) => (
                                        <Option key={d.id} value={d.id}>
                                            {d.shortName || d.longName || d.id}
                                        </Option>
                                    ))}
                                </Select>
                            </Col>
                        </Row>

                        <Row gutter={16} style={{ marginBottom: 18 }}>
                            <Col span={12}>
                                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 15 }}>
                                    Protocol
                                </label>
                                <Input name="protocol" value={formdata.protocol} onChange={handleInputChange} placeholder="e.g. Modbus, BACnet" size="large" style={{ fontSize: 15 }} />
                            </Col>
                            <Col span={12}>
                                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 15 }}>
                                    IP Address
                                </label>
                                <Input name="ipAddress" value={formdata.ipAddress} onChange={handleInputChange} placeholder="e.g. 192.168.1.10" size="large" style={{ fontSize: 15 }} />
                            </Col>
                        </Row>

                        <Row gutter={16} style={{ marginBottom: 18 }}>
                            <Col span={12}>
                                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 15 }}>
                                    Port
                                </label>
                                <InputNumber name="port" value={formdata.port} onChange={(val) => handleNumberChange("port", val)} placeholder="e.g. 502" size="large" style={{ fontSize: 15, width: "100%" }} min={0} max={65535} />
                            </Col>
                            <Col span={12}>
                                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 15 }}>
                                    Polling Interval (seconds)
                                </label>
                                <InputNumber name="pollingIntervalSeconds" value={formdata.pollingIntervalSeconds} onChange={(val) => handleNumberChange("pollingIntervalSeconds", val)} placeholder="e.g. 60" size="large" style={{ fontSize: 15, width: "100%" }} min={0} />
                            </Col>
                        </Row>

                        <Row gutter={16} style={{ marginBottom: 18 }}>
                            <Col span={12}>
                                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 15 }}>
                                    Object Id
                                </label>
                                <Input name="objectId" value={formdata.objectId} onChange={handleInputChange} placeholder="e.g. object id" size="large" style={{ fontSize: 15 }} />
                            </Col>
                            {/* <Col span={12}>
                                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 15 }}>
                                    Unit Id
                                </label>
                                <Input name="unitId" value={formdata.unitId} onChange={handleInputChange} placeholder="e.g. unit id" size="large" style={{ fontSize: 15 }} />
                            </Col> */}

                            <Col span={12}>
                                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 15 }}>
                                    Unit Detail
                                </label>


                                <Select
                                    showSearch
                                    placeholder="select unit"
                                    size="large"
                                    style={{ width: "100%", fontSize: 15 }}
                                    value={formdata.unitId}
                                    onDropdownVisibleChange={handleunitDropdownOpen}
                                    onChange={(val) => handleNumberChange("unitId", val)}
                                    notFoundContent="no unit found"
                                    filterOption={(input, option) => (
                                        option?.children ?? "").toLowerCase().includes(input.toLowerCase())
                                    }
                                >
                                    {
                                        unit.map((d) => (
                                            <Option key={d.id} value={d.unitName}>
                                                {d.unitName}
                                            </Option>
                                        ))
                                    }
                                </Select>
                            </Col>
                        </Row>

                        <Row gutter={12} style={{ marginBottom: 18 }}>
                            <Col span={24}>
                                <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 15 }}>
                                    ThingsBoard Device Id
                                </label>
                                <Input name="thingsBoardDeviceId" value={formdata.thingsBoardDeviceId} onChange={handleInputChange} placeholder="e.g. thingsboard device id" size="large" style={{ fontSize: 15 }} />
                            </Col>
                        </Row>

                        {editconfig && (
                            <Row gutter={12} style={{ marginBottom: 18 }}>
                                <Col span={24}>
                                    <label style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 600, fontSize: 15 }}>
                                        Active
                                        <Switch checked={formdata.isActive} onChange={(val) => handleNumberChange("isActive", val)} />
                                    </label>
                                </Col>
                            </Row>
                        )}

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
                                {loading ? "Saving..." : (editconfig ? "Update Config" : "Create Config")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}


            {viewmodel && (
                <div style={backdropStyle} onClick={closeViewModel}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "white", padding: "28px 32px", borderRadius: 14, width: "560px", maxWidth: "96%", zIndex: 1001, boxShadow: "0 8px 32px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto" }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                            <h3 style={{ margin: 0, color: "#1890ff", fontSize: 22 }}>
                                Device Connection Config Details
                            </h3>
                            <Button type="text" icon={<CloseOutlined style={{ fontSize: 20 }} />} onClick={closeViewModel} style={{ color: "#666" }} />
                        </div>

                        {viewloading ? (
                            <div style={{ textAlign: "center", padding: "30px 0", fontSize: 15, color: "#999" }}>Loading...</div>
                        ) : viewconfig ? (
                            <Row gutter={[16, 16]}>
                                <Col span={12}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Device</Text>
                                    <div style={{ fontSize: 15, fontWeight: 500 }}>{viewconfig.deviceShortName || "-"}</div>
                                </Col>
                                <Col span={12}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Protocol</Text>
                                    <div style={{ fontSize: 15, fontWeight: 500 }}>{viewconfig.protocol || "-"}</div>
                                </Col>
                                <Col span={12}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>IP Address</Text>
                                    <div style={{ fontSize: 15, fontWeight: 500 }}>{viewconfig.ipAddress || "-"}</div>
                                </Col>
                                <Col span={12}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Port</Text>
                                    <div style={{ fontSize: 15, fontWeight: 500 }}>{viewconfig.port ?? "-"}</div>
                                </Col>
                                <Col span={12}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Object Id</Text>
                                    <div style={{ fontSize: 15, fontWeight: 500 }}>{viewconfig.objectId || "-"}</div>
                                </Col>
                                <Col span={12}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Unit Id</Text>
                                    <div style={{ fontSize: 15, fontWeight: 500 }}>{viewconfig.unitId || "-"}</div>
                                </Col>
                                <Col span={12}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Polling Interval (s)</Text>
                                    <div style={{ fontSize: 15, fontWeight: 500 }}>{viewconfig.pollingIntervalSeconds ?? "-"}</div>
                                </Col>
                                <Col span={12}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>ThingsBoard Device Id</Text>
                                    <div style={{ fontSize: 15, fontWeight: 500 }}>{viewconfig.thingsBoardDeviceId || "-"}</div>
                                </Col>
                                <Col span={12}>
                                    <Text type="secondary" style={{ fontSize: 13 }}>Active</Text>
                                    <div style={{ fontSize: 15, fontWeight: 500 }}>
                                        <Badge status={viewconfig.isActive ? "success" : "default"} text={viewconfig.isActive ? "Active" : "Inactive"} />
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
                onImportSuccess={fetchconfigdata}
                entityName="Device Connection Config"
                apiEndpoint="/DeviceConnectionConfig/import"
                backendFields={DeviceConConfig_BACKEND_FIELDS}
            />
        </div>
    );
}

export default DeviceConnectionConfig;