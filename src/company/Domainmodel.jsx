import { Modal, Form, Input, Space } from "antd";
import { AppstoreOutlined } from "@ant-design/icons";
import { T } from "./constant";
import React from "react";
export default function DomainModal({
    open,
    onCancel,
    editingDomain,
    domainForm,
    onFinish,
    submitting,
}) {
    return (
        <Modal
            title={
                <Space>
                    <AppstoreOutlined style={{ color: T.purple.text }} />
                    {editingDomain ? "Edit Domain" : "Add Domain"}
                </Space>
            }
            open={open}
            onCancel={onCancel}
            onOk={() => domainForm.submit()}
            confirmLoading={submitting}
            width={480}
            destroyOnClose
        >
            <Form form={domainForm} layout="vertical" onFinish={onFinish}>
                <Form.Item
                    name="domainName"
                    label="Domain Name"
                    rules={[{ required: true, message: "Required" }]}
                >
                    <Input placeholder="e.g. Finance, Human Resources, Information Technology" />
                </Form.Item>
            </Form>
        </Modal>
    );
}