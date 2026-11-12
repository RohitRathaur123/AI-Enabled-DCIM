import { useState, useEffect, useRef } from "react";
import {
    Modal, Table, Button, Input, Space, Form, Popconfirm,
    message, Typography, Pagination, Switch, Tag,
} from "antd";
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    ReloadOutlined, AppstoreOutlined,
} from "@ant-design/icons";
import { axiosdevice } from "../../config";
import ImportModelCategoryModal from "./modelcategoryfile";
import React from "react";
const { Text } = Typography;
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

export default function ModelCategoryModal({ open, onClose, onCategoriesUpdated }) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [modalOpen, setModalOpen] = useState(false);

    // ── Pagination ─────────────────────────────────────────────────────────────
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageRef = useRef(1);
    const searchRef = useRef("");

    const [form] = Form.useForm();

    // ── Fetch categories (server-side paginated) ───────────────────────────────
    const fetchCategories = async (p, search) => {
        const targetPage = p ?? pageRef.current;
        const term = search ?? searchRef.current;

        setLoading(true);
        try {
            let url = `ModelCategory/get-all-model?Page=${targetPage}&PageSize=${PAGE_SIZE}`;
            if (term) url += `&search=${encodeURIComponent(term)}`;

            const raw = await axiosdevice.get(url);
            const { rows, total: t } = parsePagedResponse(raw);

            setCategories(rows);
            setTotal(t);

            // Notify parent with full list for dropdowns
            if (onCategoriesUpdated) {
                try {
                    const allRaw = await axiosdevice.get("ModelCategory/get-all-model");
                    const { rows: allRows } = parsePagedResponse(allRaw);
                    onCategoriesUpdated(allRows);
                } catch { }
            }
        } catch {
            message.error("Failed to load model categories");
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
            fetchCategories(1, "");
        }
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Search change → reset page ─────────────────────────────────────────────
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        searchRef.current = searchText;
        pageRef.current = 1;
        setPage(1);
        fetchCategories(1, searchText);
    }, [searchText]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Pagination handler ─────────────────────────────────────────────────────
    const handlePageChange = (p) => {
        pageRef.current = p;
        setPage(p);
        fetchCategories(p);
    };

    // ── Add / Edit submit ──────────────────────────────────────────────────────
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            if (editingCategory?.id) {
                await axiosdevice.post(`ModelCategory/update-model/${editingCategory.id}`, values);
                message.success("Category updated");
            } else {
                await axiosdevice.post("ModelCategory/create-model", values);
                message.success("Category added");
            }

            form.resetFields();
            setShowForm(false);
            setEditingCategory(null);
            fetchCategories(pageRef.current);
        } catch (err) {
            if (!err?.errorFields) {
                message.error(err?.response?.data?.message || err?.message || "Failed to save category");
            }
        } finally {
            setSubmitting(false);
        }
    };

    // ── Delete ─────────────────────────────────────────────────────────────────
    const handleDelete = async (id) => {
        try {
            setLoading(true);
            await axiosdevice.delete(`ModelCategory/soft-delete/${id}`);
            message.success("Category deleted");
            // If last item on current page, go back one page
            const newPage = categories.length === 1 && pageRef.current > 1
                ? pageRef.current - 1
                : pageRef.current;
            pageRef.current = newPage;
            setPage(newPage);
            fetchCategories(newPage);
        } catch {
            message.error("Failed to delete category");
        } finally {
            setLoading(false);
        }
    };

    // ── Open edit ──────────────────────────────────────────────────────────────
    const openEdit = (record) => {
        setEditingCategory(record);
        form.setFieldsValue({
            name: record.name,
            remarks: record.remarks || "",
            isActive: record.isActive ?? true,
        });
        setShowForm(true);
    };

    // ── Cancel form ────────────────────────────────────────────────────────────
    const cancelForm = () => {
        setShowForm(false);
        setEditingCategory(null);
        form.resetFields();
    };

    // ── Table columns ──────────────────────────────────────────────────────────
    const columns = [
        {
            title: "ID", dataIndex: "id", key: "id", width: 60,
            render: (id, record, index) => (
                <Text type="secondary" style={{ fontSize: 12 }}>
                    #{index + 1}
                </Text>
            ),
        },
        {
            title: "Category Name", dataIndex: "name", key: "name",
            render: (name) => (
                <Space>
                    <AppstoreOutlined style={{ color: "#722ed1" }} />
                    <Text style={{ fontWeight: 500 }}>{name || "—"}</Text>
                </Space>
            ),
        },
        {
            title: "Remarks", dataIndex: "remarks", key: "remarks",
            render: (remarks) => remarks
                ? <Text type="secondary" style={{ fontSize: 12 }}>
                    {remarks.length > 50 ? remarks.slice(0, 50) + "…" : remarks}
                </Text>
                : <Text type="secondary">—</Text>,
        },
        {
            title: "Status", dataIndex: "isActive", key: "isActive", width: 100,
            render: (isActive) => (
                <Tag color={isActive ? "success" : "default"} style={{ fontSize: 11 }}>
                    {isActive ? "Active" : "Inactive"}
                </Tag>
            ),
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
                        title="Delete this category?"
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
                    <AppstoreOutlined style={{ color: "#722ed1" }} />
                    <span>Model Category Master</span>
                </Space>
            }
            open={open}
            onCancel={onClose}
            footer={null}
            width={780}
            destroyOnClose
        >
            {/* Toolbar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                <Space wrap>
                    <Input
                        placeholder="Search categories..."
                        prefix={<span>🔍</span>}
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        allowClear
                        size="small"
                        style={{ width: 200 }}
                    />
                    <Button onClick={() => setModalOpen(true)}>
                        Import
                    </Button>
                </Space>
                <Space>
                    <Button
                        icon={<ReloadOutlined />}
                        size="small"
                        loading={loading}
                        onClick={() => fetchCategories(pageRef.current)}
                    />

                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="small"
                        style={{ background: "#722ed1", borderColor: "#722ed1" }}
                        onClick={() => { cancelForm(); setShowForm(true); }}
                    >
                        Add Category
                    </Button>
                </Space>
            </div>

            {/* Inline add/edit form */}
            {showForm && (
                <div style={{
                    background: "#f9f0ff", border: "1px solid #d3adf7",
                    borderRadius: 6, padding: "12px 16px", marginBottom: 12,
                }}>
                    <Text strong style={{ fontSize: 13, display: "block", marginBottom: 10 }}>
                        {editingCategory ? "Edit Category" : "Add New Category"}
                    </Text>
                    <Form form={form} layout="vertical">
                        <Form.Item
                            name="name"
                            label="Category Name"
                            rules={[{ required: true, message: "Category name is required" }]}
                        >
                            <Input
                                placeholder="Category name"
                                size="small"
                            />
                        </Form.Item>
                        <Form.Item
                            name="remarks"
                            label="Remarks"
                        >
                            <Input.TextArea
                                placeholder="Remarks (optional)"
                                size="small"
                                rows={2}
                            />
                        </Form.Item>
                        <Form.Item
                            name="isActive"
                            label="Status"
                            valuePropName="checked"
                        >
                            <Switch
                                checkedChildren="Active"
                                unCheckedChildren="Inactive"
                                defaultChecked
                            />
                        </Form.Item>
                        <Form.Item>
                            <Space>
                                <Button
                                    type="primary" size="small"
                                    style={{ background: "#722ed1", borderColor: "#722ed1" }}
                                    loading={submitting}
                                    onClick={handleSubmit}
                                >
                                    {editingCategory ? "Update" : "Save"}
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
                    dataSource={categories}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    size="small"
                    pagination={false}
                    scroll={{ x: "max-content" }}
                    locale={{ emptyText: "No categories found" }}
                />
                <PaginationBar
                    page={page}
                    pageSize={PAGE_SIZE}
                    total={total}
                    onChange={handlePageChange}
                />
                <ImportModelCategoryModal
                    open={modalOpen}
                    onCancel={() => setModalOpen(false)}
                    onImportSuccess={() => {
                        fetchCategories(pageRef.current);
                    }}
                />
            </div>
        </Modal>
    );
}