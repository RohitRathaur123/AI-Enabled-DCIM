import { useEffect, useState } from "react";
import { axiosdevice } from "../../config";
import { Alert, Badge, Button, Col, Input, message, Row, Space, Table, Tooltip, Typography } from "antd";
import { EditOutlined, FieldTimeOutlined, PlusOutlined, ReloadOutlined, SearchOutlined, ThunderboltOutlined, CloseOutlined, DownloadOutlined } from "@ant-design/icons";
import React from "react";
import ExcelExport from "../entity/excelexport";
import GenericImportModal from "../devicedetails/GenericImportFIle";
const { Title, Text } = Typography;

const BACKEND_FIELDS = [
    {
        key: "name",
        label: "Name",
        required: true,
        color: "blue",
        hint: "e.g. Head Office, Main Building",
    },
    {
        key: "siteName",
        label: "Site Name",
        required: true,
        color: "cyan",
        hint: "e.g. Delhi Campus, Noida Office",
    },
    {
        key: "floorPlanFileUrl",
        label: "Floor Plan File URL",
        required: false,
        color: "purple",
        hint: "e.g. https://example.com/floor-plan.pdf",
    },
];

function AddFloor() {
    const [dataitems, setdataitems] = useState([]);

    const emptyForm = {
        name: "", siteName: "", floorPlanFileUrl: ""
    };

    const [formdata, setformdata] = useState(emptyForm);

    const [error, seterror] = useState("");
    const [showmodel, setshowmodel] = useState(false);
    const [editfloor, seteditfloor] = useState(null);
    const [loading, setloading] = useState(false);
    const [tableloading, settableloading] = useState(false);
    const [searchText, setSearchText] = useState("");

    const [showExportModal, setShowExportModal] = useState(false)
    const [showImportModal, setShowImportModal] = useState(false);

    const fetchfloordata = async () => {
        settableloading(true);

        try {
            const res = await axiosdevice.get("/Floor/get-all-floors", {
                params: {
                    Page: 1,
                    PageSize: 100,
                    Search: "",
                    IsPaginated: false
                }
            });

            console.log("========== FLOOR API ==========");
            console.log("RES:", res);
            console.log("RES.DATA:", res?.data);
            console.log("RES.DATA.DATA:", res?.data?.data);
            console.log("================================");

            let list = [];

            if (Array.isArray(res?.data?.data)) {
                // Normal Axios response
                list = res.data.data;
            } else if (Array.isArray(res?.data)) {
                // Axios interceptor returned response.data
                list = res.data;
            } else if (Array.isArray(res)) {
                // Custom axios wrapper returned array
                list = res;
            }

            console.log("FINAL FLOOR LIST:", list);

            setdataitems(list);

        } catch (error) {
            console.error("FLOOR API ERROR:", error);
            console.error("ERROR RESPONSE:", error?.response);
        } finally {
            settableloading(false);
        }
    };

    useEffect(() => {
        fetchfloordata();
    }, []);

    const openAddModal = () => {
        seteditfloor(null);
        setformdata(emptyForm);
        setshowmodel(true);
    };

    const editOpenModel = (floordata) => {
        seteditfloor(floordata);
        setformdata({
            name: floordata.name || "",
            siteName: floordata.siteName || floordata.sitename || "",
            floorPlanFileUrl: floordata.floorPlanFileUrl || ""
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

    const handleSubmit = async () => {
        if (!formdata.name || !formdata.siteName) {
            message.warning("Please fill in Floor Name and Site Name");
            return;
        }
        setloading(true);
        try {
            if (editfloor) {
                await axiosdevice.post(`/floor/${editfloor.id}/update-floor`, {
                    name: formdata.name,
                    siteName: formdata.siteName,
                    floorPlanFileUrl: formdata.floorPlanFileUrl,
                    isActive: true
                });
                message.success("Floor updated successfully");
            } else {
                await axiosdevice.post("/floor/add-floor", formdata);
                message.success("Floor created successfully");
            }
            closeModal();
            fetchfloordata();
        } catch (error) {
            console.log(error, "error in submit");
            message.error("Something went wrong, please try again");
        } finally {
            setloading(false);
        }
    };

    const filteredData = dataitems.filter((s) =>
        !searchText || (s.name || "").toLowerCase().includes(searchText.toLowerCase())
    );

    const backdropStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000 };
    const totalfloor = dataitems.length;

    const columns = [
        {
            title: "ID", dataIndex: "id", key: "id", width: 70,
            render: (text, record, index) => index + 1
        },
        {
            title: "Floor Name", dataIndex: "name", key: "name", width: 260,
            render: (text) => (
                <Space size={8}>
                    <ThunderboltOutlined style={{ color: "#1890ff", fontSize: 16 }} />
                    <Text style={{ fontSize: 15 }}>{text}</Text>
                </Space>
            ),
        },
        {
            title: "Site Name", dataIndex: "siteName", key: "siteName", width: 220,
            render: (text, record) => (
                <Space size={8}>
                    <ThunderboltOutlined style={{ color: "#1890ff", fontSize: 16 }} />
                    <Text style={{ fontSize: 15 }}>{text || record.sitename}</Text>
                </Space>
            ),
        },
        {
            title: "Floor Plan File Url", dataIndex: "floorPlanFileUrl", key: "floorPlanFileUrl", width: 260,
            render: (text) => (
                <Space size={8}>
                    <ThunderboltOutlined style={{ color: "#1890ff", fontSize: 16 }} />
                    <Text style={{ fontSize: 15 }}>{text}</Text>
                </Space>
            ),
        },
        {
            title: "Actions", key: "actions", width: 120, fixed: "right",
            render: (_, record) => (
                <Space size={6}>
                    <Tooltip title="Edit">
                        <Button type="text" size="middle" icon={<EditOutlined style={{ fontSize: 18 }} />} onClick={() => editOpenModel(record)} style={{ color: "#1890ff" }} />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f0f2f5", padding: "12px 20px", boxSizing: "border-box" }}>

            {/* HEADER (compact) */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexShrink: 0 }}>
                <div>
                    <Title level={4} style={{ margin: 0, lineHeight: 1.2 }}>
                        <FieldTimeOutlined style={{ marginRight: 8, color: "#1890ff" }} />
                        Floor Management
                    </Title>
                </div>
                <Space size={8}>
                    <Button size="small" onClick={() => setShowImportModal(true)}>Import File</Button>
                    <Button
                        type="primary"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={openAddModal}
                        style={{ background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)", border: "none" }}
                    >
                        Create Floor
                    </Button>
                    <Button size="small" icon={<DownloadOutlined />} onClick={() => setShowExportModal(true)}>
                        Export
                    </Button>
                    <ExcelExport
                        open={showExportModal}
                        onClose={() => setShowExportModal(false)}
                        searchText={searchText}
                        apiUrl="/Floor/export"
                        fileNamePrefix="Floor"
                    />
                    <Button size="small" icon={<ReloadOutlined />} onClick={fetchfloordata}>
                        Refresh
                    </Button>
                </Space>
            </div>

            {error && <Alert message={error} type="error" showIcon closable onClose={() => seterror(null)} style={{ marginBottom: 8, padding: "4px 12px", fontSize: 13 }} />}

            {/* SEARCH (compact) */}
            <div style={{ backgroundColor: "white", borderRadius: 8, padding: "8px 14px", marginBottom: 10, flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <Row gutter={12} align="middle">
                    <Col xs={24} sm={14} md={10}>
                        <Input
                            placeholder="Search by Floor name..."
                            prefix={<SearchOutlined style={{ color: "#bbb", fontSize: 14 }} />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                            size="small"
                            style={{ fontSize: 13 }}
                        />
                    </Col>
                    <Col xs={24} sm={10} md={14} style={{ textAlign: "right" }}>
                        <Text style={{ fontSize: 13, color: "#888" }}>Showing {filteredData.length} of {totalfloor}</Text>
                    </Col>
                </Row>
            </div>

            {/* TABLE */}
            <div style={{ flex: 1, backgroundColor: "white", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
                <div style={{ padding: "8px 16px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                    <Text strong style={{ fontSize: 15 }}>Floor Management</Text>
                    <Badge count={filteredData.length} style={{ backgroundColor: "#1890ff", fontSize: 12 }} />
                </div>
                <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
                    <Table
                        columns={columns} dataSource={filteredData} loading={tableloading}
                        bordered={false} rowKey="id" size="small"
                        scroll={{ x: 900 }}
                        pagination={{ pageSize: 10, showSizeChanger: false, showTotal: (total) => `${total} Floors`, style: { padding: "8px 16px", margin: 0 } }}
                        style={{ fontSize: 14 }}
                        locale={{ emptyText: <div style={{ padding: "18px 0", textAlign: "center", color: "#999", fontSize: 14 }}>No Floor found</div> }}
                    />
                </div>
            </div>


            {/* ADD / EDIT MODAL */}
            {showmodel && (
                <div style={backdropStyle} onClick={closeModal}>
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "white", padding: "24px 28px", borderRadius: 12, width: "520px", maxWidth: "96%", zIndex: 1001, boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                            <h3 style={{ margin: 0, color: "#1890ff", fontSize: 20 }}>
                                {editfloor ? `Edit Floor: ${editfloor.name}` : "Create New Floor"}
                            </h3>
                            <Button type="text" icon={<CloseOutlined style={{ fontSize: 18 }} />} onClick={closeModal} style={{ color: "#666" }} />
                        </div>

                        <Row gutter={12} style={{ marginBottom: 14 }}>
                            <Col span={24}>
                                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                                    Floor Name
                                </label>
                                <Input name="name" value={formdata.name} onChange={handleInputChange} placeholder="e.g. Floor 1" size="middle" style={{ fontSize: 14 }} />
                            </Col>
                        </Row>

                        <Row gutter={12} style={{ marginBottom: 14 }}>
                            <Col span={24}>
                                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                                    Site Name
                                </label>
                                <Input name="siteName" value={formdata.siteName} onChange={handleInputChange} placeholder="e.g. Site A" size="middle" style={{ fontSize: 14 }} />
                            </Col>
                        </Row>

                        <Row gutter={12} style={{ marginBottom: 14 }}>
                            <Col span={24}>
                                <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14 }}>
                                    Floor Plan File Url
                                </label>
                                <Input name="floorPlanFileUrl" value={formdata.floorPlanFileUrl} onChange={handleInputChange} placeholder="e.g. https://..." size="middle" style={{ fontSize: 14 }} />
                            </Col>
                        </Row>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
                            <Button onClick={closeModal} size="middle" style={{ fontSize: 14 }}>Cancel</Button>
                            <Button
                                type="primary"
                                onClick={handleSubmit}
                                loading={loading}
                                icon={editfloor ? <EditOutlined /> : <PlusOutlined />}
                                size="middle"
                                style={{ fontSize: 14 }}
                            >
                                {loading ? "Saving..." : (editfloor ? "Update Floor" : "Create Floor")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <GenericImportModal
                open={showImportModal}
                onCancel={() => setShowImportModal(false)}
                onImportSuccess={fetchfloordata}
                entityName="Floor"
                apiEndpoint="/Floor/import"
                backendFields={BACKEND_FIELDS}
            />
        </div>
    );
}

export default AddFloor;