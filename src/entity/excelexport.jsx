/**
 * ExcelExport.jsx
 *
 * Generic Excel export button — pass `data` (array of flat objects) and it
 * writes an .xlsx file with auto column widths.
 *
 * Props:
 *   data        — array of plain objects (keys = column headers)
 *   fileName    — filename without extension (default: "export")
 *   sheetName   — sheet tab name (default: "Sheet1")
 *   buttonText  — button label
 *   disabled    — boolean
 *   loading     — boolean (shows Ant spinner)
 *   style       — extra button style
 */
// import React from "react";
// import { Button } from "antd";
// import { DownloadOutlined } from "@ant-design/icons";
// import * as XLSX from "xlsx";

// const ExcelExport = ({
//     data       = [],
//     fileName   = "export",
//     sheetName  = "Sheet1",
//     buttonText = "Export Excel",
//     disabled   = false,
//     loading    = false,
//     style      = {},
// }) => {
//     const handleExport = () => {
//         if (!data || !data.length) {
//             alert("No data available to export");
//             return;
//         }

//         const ws = XLSX.utils.json_to_sheet(data);

//         // Auto column widths — based on longest cell value in each column
//         const headers = Object.keys(data[0] || {});
//         ws["!cols"] = headers.map(h => {
//             const maxLen = Math.max(
//                 h.length,
//                 ...data.map(row => String(row[h] ?? "").length)
//             );
//             return { wch: Math.min(maxLen + 2, 60) }; // cap at 60 chars
//         });

//         const wb = XLSX.utils.book_new();
//         XLSX.utils.book_append_sheet(wb, ws, sheetName);
//         XLSX.writeFile(wb, `${fileName}.xlsx`);
//     };

//     return (
//         <Button
//             icon={<DownloadOutlined />}
//             onClick={handleExport}
//             disabled={disabled || loading}
//             loading={loading}
//             style={{ color: "#16A34A", borderColor: "#16A34A", ...style }}
//         >
//             {buttonText}
//         </Button>
//     );
// };

// export default ExcelExport;



import React, { useState } from 'react';
import { Modal, Radio, Switch, InputNumber, Space, Typography, message } from 'antd';
import {
    FileExcelOutlined, FilePdfOutlined, FileTextOutlined, DownloadOutlined
} from '@ant-design/icons';
import { axiosdevice } from '../../config'; // apne actual path se adjust karo

const { Text } = Typography;

const FORMAT_OPTIONS = [
    { value: 'csv', label: 'CSV', icon: <FileTextOutlined />, ext: 'csv', mime: 'text/csv' },
    { value: 'excel', label: 'Excel', icon: <FileExcelOutlined />, ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
    { value: 'pdf', label: 'PDF', icon: <FilePdfOutlined />, ext: 'pdf', mime: 'application/pdf' },
];

function ExcelExport({ open, onClose, searchText = '', apiUrl = '/DeviceCategory/export', fileNamePrefix = 'DeviceCategory' }) {
    const [format, setFormat] = useState('excel');
    const [isPaginated, setIsPaginated] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [loading, setLoading] = useState(false);

    const handleClose = () => {
        if (loading) return;
        onClose();
    };

    const handleExport = async () => {
        setLoading(true);
        try {
            const params = {
                format,
                Search: searchText || undefined,
                IsPaginated: isPaginated,
            };
            if (isPaginated) {
                params.Page = page;
                params.PageSize = pageSize;
            }

            // ✅ axiosdevice use ho raha hai — interceptor blob ko as-is return karega
            const res = await axiosdevice.get(apiUrl, {
                params,
                responseType: 'blob',
            });

            const selected = FORMAT_OPTIONS.find(f => f.value === format);
            // ⚠️ interceptor already response.data return kar chuka hai, isliye 'res' hi blob hai — res.data NAHI
            const blob = new Blob([res], { type: selected.mime });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${fileNamePrefix}_${Date.now()}.${selected.ext}`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            message.success('Export successful!');
            onClose();
        } catch (err) {
            console.error(err);
            message.error('Export failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            title={
                <Space>
                    <DownloadOutlined style={{ color: '#1890ff' }} />
                    <span>Export Categories</span>
                </Space>
            }
            onCancel={handleClose}
            onOk={handleExport}
            okText={loading ? 'Exporting...' : 'Export'}
            confirmLoading={loading}
            destroyOnClose
            width={440}
        >
            <div style={{ marginBottom: 20 }}>
                <Text strong style={{ display: 'block', marginBottom: 10, fontSize: 13 }}>
                    Select Export Format
                </Text>
                <Radio.Group
                    value={format}
                    onChange={e => setFormat(e.target.value)}
                    style={{ width: '100%' }}
                >
                    <Space direction="vertical" style={{ width: '100%' }}>
                        {FORMAT_OPTIONS.map(opt => (
                            <Radio key={opt.value} value={opt.value} style={{ width: '100%' }}>
                                <Space>
                                    {opt.icon} {opt.label}
                                </Space>
                            </Radio>
                        ))}
                    </Space>
                </Radio.Group>
            </div>

            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isPaginated ? 14 : 0 }}>
                    <Text strong style={{ fontSize: 13 }}>Limit Pages? <Text type="secondary" style={{ fontWeight: 400, fontSize: 12 }}>(optional)</Text></Text>
                    <Switch checked={isPaginated} onChange={setIsPaginated} />
                </div>

                {isPaginated && (
                    <Space size={16}>
                        <div>
                            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Page</Text>
                            <InputNumber min={1} value={page} onChange={setPage} style={{ width: 100 }} />
                        </div>
                        <div>
                            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Page Size</Text>
                            <InputNumber min={1} max={500} value={pageSize} onChange={setPageSize} style={{ width: 100 }} />
                        </div>
                    </Space>
                )}
            </div>
        </Modal>
    );
}

export default ExcelExport;