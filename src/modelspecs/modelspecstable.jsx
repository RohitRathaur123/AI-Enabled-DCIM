import { Table, Space, Button, Tooltip, Badge, Tag, Typography } from "antd";
import {
    EyeOutlined, DownloadOutlined, EditOutlined, DeleteOutlined,
    DashboardOutlined, AppstoreOutlined, BankOutlined, CodeOutlined,
} from "@ant-design/icons";
import React from "react";
const { Text } = Typography;

export default function ModelSpecTable({
    dataSource, loading,
    onPreview, onDownload, onEdit, onDelete,
}) {
    const columns = [
        // {
        //     title: "ID", dataIndex: "id", key: "id", width: 45,
        //     sorter: (a, b) => a.id - b.id,
        // },
        {
            title: "Name", dataIndex: "name", key: "name", width: 150,
            render: text => <Tag color="purple" icon={<CodeOutlined />}>{text}</Tag>,
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        {
            title: "Device Type", dataIndex: "deviceTypeName", key: "deviceTypeName", width: 120,
            render: text => (
                <Space size={4}>
                    <DashboardOutlined style={{ color: "#52c41a", fontSize: 11 }} />
                    <Text style={{ fontSize: 12 }}>{text || "-"}</Text>
                </Space>
            ),
            sorter: (a, b) => (a.deviceTypeName || "").localeCompare(b.deviceTypeName || ""),
        },
        // {
        //     title: "Model Cat.", dataIndex: "modelCategoryName", key: "modelCategoryName", width: 110,
        //     render: text => (
        //         <Space size={4}>
        //             <AppstoreOutlined style={{ color: "#722ed1", fontSize: 11 }} />
        //             <Text style={{ fontSize: 12 }}>{text || "-"}</Text>
        //         </Space>
        //     ),
        // },
        {
            title: "Company",
            dataIndex: "companyName",
            key: "companyName",
            width: 120,

            render: (text) => (
                <Space size={4}>
                    <BankOutlined style={{ fontSize: 11 }} />

                    <Text style={{ fontSize: 12 }}>
                        {text || "-"}
                    </Text>
                </Space>
            ),
        },
        {
            title: "Model No", dataIndex: "modelNumber", key: "modelNumber", width: 100,
            render: text => (
                <Tag color="blue" icon={<CodeOutlined />} style={{ fontSize: 11 }}>
                    {text || "-"}
                </Tag>
            ),
        },
        {
            title: "Params", key: "params", width: 65,
            render: (_, record) => (
                <Tooltip title="Click to view parameters">
                    <Badge
                        count={record.parameters?.length || 0}
                        showZero
                        style={{ backgroundColor: "#722ed1", cursor: "pointer" }}
                        onClick={() => onPreview(record, "parameters")}
                    />
                </Tooltip>
            ),
        },
        {
            title: "Date", dataIndex: "createdDate", key: "createdDate", width: 90,
            sorter: (a, b) => (a.createdDate || "").localeCompare(b.createdDate || ""),
        },
        {
            title: "Actions", key: "actions", width: 130, fixed: "right",
            render: (_, record) => (
                <Space size={2}>
                    <Tooltip title="Preview">
                        <Button type="text" size="small" icon={<EyeOutlined />}
                            onClick={() => onPreview(record, "details")} />
                    </Tooltip>
                    <Tooltip title="Download">
                        <Button type="text" size="small" icon={<DownloadOutlined />}
                            onClick={() => onDownload(record)} />
                    </Tooltip>
                    <Tooltip title="Edit">
                        <Button type="text" size="small" icon={<EditOutlined />}
                            onClick={() => onEdit(record)} />
                    </Tooltip>
                    <Tooltip title="Delete">
                        <Button type="text" size="small" danger icon={<DeleteOutlined />}
                            onClick={() => onDelete(record)} />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <Table
            columns={columns}
            dataSource={dataSource}
            loading={loading}
            rowKey="id"
            size="small"
            // pagination={{
            //     pageSize: 10,
            //     showTotal: total => `${total} specifications`,
            //     showSizeChanger: true,
            //     pageSizeOptions: ["10", "20", "50"],
            // }}
            scroll={{ x: "max-content" }}
        />
    );
}