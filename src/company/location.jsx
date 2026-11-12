import { Modal, Button, Spin } from "antd";
import { EnvironmentOutlined, PlusOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { T } from "./constant";
import EmptyState from "./Emptystate";
import LocationCard from "./locationcard";
import React from "react";
export default function LocationModal({
    open, onCancel,
    assigningCompany,
    assignLocations, setAssignLocations,
    locationLoading,
    savingLocIdx, deletingLocId,
    countries, timezones,
    docTypes, issuers,    // ✅ add karo
    emptyLocation,
    onUpdate, onSave, onDelete,
}){
    return (
        <Modal
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <EnvironmentOutlined style={{ color: T.teal.text }} />
                    <span style={{ fontWeight: 600 }}>
                        Locations — {assigningCompany?.companyName}
                    </span>
                </div>
            }
            open={open}
            onCancel={onCancel}
            width={920}
            style={{ top: 20 }}
            styles={{
                body: {
                    padding: "16px 20px",
                    maxHeight: "78vh",
                    overflowY: "auto",
                    overflowX: "hidden",
                },
            }}
            footer={[
                <Button key="close" onClick={onCancel}>Close</Button>,
                <Button
                    key="add"
                    icon={<PlusOutlined />}
                    onClick={() => setAssignLocations(p => [...p, emptyLocation()])}
                    style={{ borderStyle: "dashed" }}
                >
                    Add Location
                </Button>,
            ]}
            destroyOnClose
        >
            {locationLoading ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                    <Spin tip="Loading locations..." />
                </div>
            ) : (
                <>
                    <div style={{
                        background: T.amber.bg, border: `1px solid ${T.amber.border}`,
                        borderRadius: T.radius.md, padding: "8px 12px",
                        marginBottom: 14, display: "flex", alignItems: "center", gap: 8,
                    }}>
                        <ExclamationCircleOutlined style={{ color: T.amber.text }} />
                        <span style={{ fontSize: 12, color: T.amber.dark }}>
                            Each location is saved independently. Edit, save, or delete locations as needed.
                        </span>
                    </div>

                    {assignLocations.map((loc, index) => (
                       // location.jsx — LocationCard ke andar add karo
<LocationCard
    key={loc.id || index}
    loc={loc}
    index={index}
    countries={countries}
    timezones={timezones}
    docTypes={docTypes}      // ✅ add
    issuers={issuers}        // ✅ add
    onUpdate={(field, val) => onUpdate(index, field, val)}
    onSave={() => onSave(index)}
    onDelete={() => onDelete(index)}
    saving={savingLocIdx === index}
    deleting={deletingLocId === loc.id}
/>
                    ))}

                    {assignLocations.length === 0 && (
                        <EmptyState
                            icon={<EnvironmentOutlined />}
                            color={T.teal.text}
                            bg={T.teal.bg}
                            border={T.teal.border}
                            message='No locations added. Click "Add Location" to begin.'
                        />
                    )}
                </>
            )}
        </Modal>
    );
}