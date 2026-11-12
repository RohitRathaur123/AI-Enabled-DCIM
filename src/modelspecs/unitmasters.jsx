import { useState, useEffect, useRef } from "react";
import {
    Modal, Table, Button, Input, Space, Form, Popconfirm,
    message, Typography, Pagination,
} from "antd";
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    ReloadOutlined, SettingOutlined,
} from "@ant-design/icons";
import { axiosdevice } from "../../config";
import React from "react";
const { Title, Text } = Typography;

const PAGE_SIZE = 10;

// ─── PaginationBar ─────────────────────────────────────────────────────────────
function PaginationBar({ page, pageSize, total, onChange }) {
    return (
        <div style={{
            display: "flex", justifyContent: "flex-end", alignItems: "center",
            padding: "10px 16px",
            borderTop: "1px solid #F3F4F6",
            background: "#FAFAFA",
        }}>
            <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                size="small"
                showTotal={(t) => `Total ${t} items`}
                onChange={onChange}
                showSizeChanger={false}
            />
        </div>
    );
}

// ─── Shared envelope parser ───────────────────────────────────────────────────
const parsePagedResponse = (raw) => {
    const envelope =
        raw?.totalRecords !== undefined ? raw
            : raw?.data?.totalRecords !== undefined ? raw.data
                : raw?.data !== undefined ? raw.data
                    : raw;

    if (Array.isArray(envelope)) {
        return { rows: envelope, total: envelope.length };
    }
    if (Array.isArray(envelope?.data)) {
        return { rows: envelope.data, total: envelope.totalRecords ?? envelope.totalCount ?? envelope.total ?? envelope.data.length };
    }
    if (Array.isArray(envelope?.items)) {
        return { rows: envelope.items, total: envelope.totalCount ?? envelope.total ?? envelope.items.length };
    }
    const rows = Array.isArray(envelope) ? envelope : [];
    return { rows, total: rows.length };
};

export default function UnitMasterModal({ open, onClose, onUnitsUpdated }) {
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [searchText, setSearchText] = useState("");

    // ── Pagination ─────────────────────────────────────────────────────────────
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageRef = useRef(1);
    const searchRef = useRef("");

    const [form] = Form.useForm();

    // ── Fetch units (server-side paginated) ────────────────────────────────────
    const fetchUnits = async (p, search) => {
        const targetPage = p ?? pageRef.current;
        const term = search ?? searchRef.current;

        setLoading(true);
        try {
            let url = `UnitMaster/get-all-units?Page=${targetPage}&PageSize=${PAGE_SIZE}`;
            if (term) url += `&search=${encodeURIComponent(term)}`;

            const raw = await axiosdevice.get(url);
            const { rows, total: t } = parsePagedResponse(raw);

            setUnits(rows);
            setTotal(t);

            // Notify parent with fresh full list (optional — fetches all for dropdowns)
            if (onUnitsUpdated) {
                try {
                    const allRaw = await axiosdevice.get("UnitMaster/get-all-units");
                    const { rows: allRows } = parsePagedResponse(allRaw);
                    onUnitsUpdated(allRows);
                } catch { }
            }
        } catch {
            message.error("Failed to load units");
        } finally {
            setLoading(false);
        }
    };

    // ── On open ────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (open) {
            pageRef.current = 1;
            searchRef.current = "";
            setPage(1);
            setSearchText("");
            fetchUnits(1, "");
        }
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Search change → reset page ─────────────────────────────────────────────
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        searchRef.current = searchText;
        pageRef.current = 1;
        setPage(1);
        fetchUnits(1, searchText);
    }, [searchText]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Pagination handler ─────────────────────────────────────────────────────
    const handlePageChange = (p) => {
        pageRef.current = p;
        setPage(p);
        fetchUnits(p);
    };

    // ── Add / Edit submit ──────────────────────────────────────────────────────
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            if (editingUnit?.id) {
                await axiosdevice.post(`UnitMaster/update-unit/${editingUnit.id}`, values);
                message.success("Unit updated");
            } else {
                await axiosdevice.post("UnitMaster/create-unit", values);
                message.success("Unit added");
            }

            form.resetFields();
            setShowForm(false);
            setEditingUnit(null);
            fetchUnits(pageRef.current);
        } catch (err) {
            if (!err?.errorFields) {
                message.error(err?.response?.data?.message || err?.message || "Failed to save unit");
            }
        } finally {
            setSubmitting(false);
        }
    };

    // ── Delete ─────────────────────────────────────────────────────────────────
    const handleDelete = async (id) => {
        try {
            setLoading(true);
            await axiosdevice.delete(`UnitMaster/${id}`);
            message.success("Unit deleted");
            // If last item on current page, go back one page
            const newPage = units.length === 1 && pageRef.current > 1
                ? pageRef.current - 1
                : pageRef.current;
            pageRef.current = newPage;
            setPage(newPage);
            fetchUnits(newPage);
        } catch {
            message.error("Failed to delete unit");
        } finally {
            setLoading(false);
        }
    };

    // ── Open edit ──────────────────────────────────────────────────────────────
    const openEdit = (record) => {
        setEditingUnit(record);
        form.setFieldsValue({ unitName: record.unitName, unitSymbol: record.unitSymbol });
        setShowForm(true);
    };

    // ── Cancel form ────────────────────────────────────────────────────────────
    const cancelForm = () => {
        setShowForm(false);
        setEditingUnit(null);
        form.resetFields();
    };

    // ── Table columns ──────────────────────────────────────────────────────────
    const columns = [
        // {
        //     title: "ID", dataIndex: "id", key: "id", width: 60,
        //     render: (id) => <Text type="secondary" style={{ fontSize: 12 }}>#{id}</Text>,
        // },

        {
            title: "ID", dataIndex: "id", key: "id", width: 60,
            render: (id, record, index) => (
                <Text type="secondary" style={{ fontSize: 12 }}>
                    #{index + 1}
                </Text>
            ),
        },
        {
            title: "Unit Name", dataIndex: "unitName", key: "unitName",
            render: (name) => <Text style={{ fontWeight: 500 }}>{name || "—"}</Text>,
        },
        {
            title: "Symbol", dataIndex: "unitSymbol", key: "unitSymbol", width: 120,
            render: (sym) => sym
                ? <span style={{
                    background: "#f0f5ff", color: "#2f54eb",
                    border: "1px solid #adc6ff", borderRadius: 4,
                    padding: "2px 10px", fontSize: 13, fontWeight: 600,
                }}>{sym}</span>
                : <Text type="secondary">—</Text>,
        },
        {
            title: "Actions", key: "actions", width: 100, fixed: "right",
            render: (_, r) => (
                <Space size="small">
                    <Button
                        icon={<EditOutlined />} size="small" type="primary" ghost
                        onClick={() => openEdit(r)}
                    />
                    <Popconfirm
                        title="Delete this unit?"
                        onConfirm={() => handleDelete(r.id)}
                        okText="Delete" okButtonProps={{ danger: true }}
                        cancelText="Cancel"
                    >
                        <Button danger icon={<DeleteOutlined />} size="small" />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Modal
            title={
                <Space>
                    <SettingOutlined style={{ color: "#1890ff" }} />
                    <span>Unit Master</span>
                </Space>
            }
            open={open}
            onCancel={onClose}
            footer={null}
            width={700}
            destroyOnClose
        >
            {/* Toolbar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Input
                    placeholder="Search units..."
                    prefix={<span>🔍</span>}
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    allowClear
                    size="small"
                    style={{ width: 220 }}
                />
                <Space>
                    <Button
                        icon={<ReloadOutlined />}
                        size="small"
                        loading={loading}
                        onClick={() => fetchUnits(pageRef.current)}
                    />

                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="small"
                        onClick={() => { cancelForm(); setShowForm(true); }}
                    >
                        Add Unit
                    </Button>
                </Space>
            </div>

            {/* Inline add/edit form */}
            {showForm && (
                <div style={{
                    background: "#f6ffed", border: "1px solid #b7eb8f",
                    borderRadius: 6, padding: "12px 16px", marginBottom: 12,
                }}>
                    <Text strong style={{ fontSize: 13, display: "block", marginBottom: 10 }}>
                        {editingUnit ? "Edit Unit" : "Add New Unit"}
                    </Text>
                    <Form form={form} layout="inline">
                        <Form.Item
                            name="unitName"
                            rules={[{ required: true, message: "Unit name is required" }]}
                        >
                            <Input placeholder="Unit name (e.g. Kilogram)" size="small" style={{ width: 200 }} />
                        </Form.Item>
                        <Form.Item name="unitSymbol">
                            <Input placeholder="Symbol (e.g. kg)" size="small" style={{ width: 120 }} />
                        </Form.Item>
                        <Form.Item>
                            <Space>
                                <Button
                                    type="primary" size="small"
                                    loading={submitting}
                                    onClick={handleSubmit}
                                >
                                    {editingUnit ? "Update" : "Save"}
                                </Button>
                                <Button size="small" onClick={cancelForm}>
                                    Cancel
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </div>
            )}

            {/* Table */}
            <div style={{ border: "1px solid #f0f0f0", borderRadius: 6, overflow: "hidden" }}>
                <Table
                    dataSource={units}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    size="small"
                    pagination={false}
                    scroll={{ x: "max-content" }}
                    locale={{ emptyText: "No units found" }}
                />
                <PaginationBar
                    page={page}
                    pageSize={PAGE_SIZE}
                    total={total}
                    onChange={handlePageChange}
                />
            </div>
        </Modal>
    );
}