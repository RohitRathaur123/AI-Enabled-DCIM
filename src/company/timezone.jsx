import { Modal, Form, Input, Select, Space } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import { T } from "./constant";
import React from "react";

const { Option } = Select;

export default function TimezoneModal({
    open,
    onCancel,
    editingTimeZone,
    timeZoneForm,
    onFinish,
    submitting,
    countries,
}) {
    return (
        <Modal
            title={
                <Space>
                    <ClockCircleOutlined style={{ color: T.amber.text }} />
                    {editingTimeZone ? "Edit Timezone" : "Add Timezone"}
                </Space>
            }
            open={open}
            onCancel={onCancel}
            onOk={() => timeZoneForm.submit()}
            confirmLoading={submitting}
            width={500}
            destroyOnClose
        >
            <Form
                form={timeZoneForm}
                layout="vertical"
                onFinish={onFinish}
            >
                <Form.Item
                    name="timeZoneName"
                    label="Timezone Name"
                    rules={[{ required: true, message: "Required" }]}
                >
                    <Input placeholder="e.g. Asia/Kolkata" />
                </Form.Item>

                <Form.Item name="utcOffset" label="UTC Offset">
                    <Input placeholder="e.g. +05:30" />
                </Form.Item>

                <Form.Item name="countryId" label="Country">
                    <Select
                        showSearch
                        placeholder="Select country"
                        filterOption={(i, o) =>
                            o?.children?.toLowerCase().includes(i.toLowerCase())
                        }
                        style={{ width: "100%" }}
                    >
                        {countries.map((c) => (
                            <Option key={c.id} value={c.id}>
                                {c.name}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    );
}