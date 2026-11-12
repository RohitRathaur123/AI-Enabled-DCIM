import React, { useCallback } from "react";
import { Tabs } from "antd";
import { useSearchParams } from "react-router-dom";   // ✅ CHANGE #1: router hook import
import {
    BorderOutlined,
    DatabaseOutlined,
    TeamOutlined,
    UserOutlined,
    CloudServerOutlined,
    CustomerServiceOutlined,
    ApartmentOutlined,
} from "@ant-design/icons";

// ── Area ke andar wale pages ──
import AddCountry from "../pages/AddCountry";
import AddState from "../pages/AddState";
import AddCity from "../pages/AddCity";
import AddSite from "../pages/AddSite";

// ── Device ke andar wale pages ──
import DeviceDetail from "../devicedetails";
import DeviceMaster from "../devicedetails/devicemaster";
import DeviceTypePage from "../devicedetails/devicetype";
import NetworkConnection from "../devicedetails/networkconnection";
import DeviceCategoryPage from "../devicedetails/devicecategory";
import DeviceConnectionConfig from "../devicedetails/deviceconnectionconfig";
import ModelSpecificationPage from "../modelspecs/index";
import DeviceRackLocationPage from "../devicedetails/DeviceRackLocation";

// ── Master ke flat items ──
import Company from "../company/index";
import AddUser from "../pages/AddUser";
import AddRole from "../pages/AddRole";
import AddDataCenter from "../pages/AddDataCenter";
import AddService from "../pages/AddService";
import RulesEngine from "../pages/RulesEngine";
import RoomManager from "../devicedetails/Room";
import RackPage from "../devicedetails/Rack";
import Currency from "../pages/AddCurrency";
import AddFloor from "../pages/Addfloor";
import RackPowerCapacityPage from "../devicedetails/RackPowerCapacity";

// ─────────────────────────────────────────────
// ✅ CHANGE #2: URL query param names — top-level tab "tab" mein,
// nested sub-tab "subtab" mein store hoga.
// Example URL: /master?tab=device-group&subtab=devicetypepage
// ─────────────────────────────────────────────
const QUERY_KEYS = {
    TOP: "tab",
    SUB: "subtab",
};

const DEFAULT_TOP_TAB = "area";

// ─────────────────────────────────────────────
// ✅ CHANGE #3: NestedTabGroup ab "controlled" component hai —
// activeKey aur onChange bahar se (MasterDashboard se) aate hain.
// Pehle ye sirf defaultActiveKey use karta tha jo refresh pe reset ho jaata tha.
// ─────────────────────────────────────────────
const NestedTabGroup = ({ items, activeKey, onChange }) => (
    <div
        style={{
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #edf0f5",
            padding: "10px 14px 16px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
        }}
    >
        <Tabs
            activeKey={activeKey || items[0].key}   // ✅ controlled — defaultActiveKey nahi
            onChange={onChange}                      // ✅ change hone par parent ko batao
            items={items}
            type="line"
            size="small"
            className="master-nested-tabs"
        />
    </div>
);

// ── AREA sub-items (nested tabs) ──
const AREA_ITEMS = [
    { key: "currency", label: "Currency", children: <Currency /> },
    { key: "country", label: "Country", children: <AddCountry /> },
    { key: "state", label: "State", children: <AddState /> },
    { key: "city", label: "City", children: <AddCity /> },
    { key: "site", label: "Site", children: <AddSite /> },
];

// ── DEVICE sub-items (nested tabs) ──
const DEVICE_ITEMS = [
    { key: "devicecategorypage", label: "Category", children: <DeviceCategoryPage /> },
    { key: "devicetypepage", label: "Type", children: <DeviceTypePage /> },
    { key: "modalspecspage", label: "Model Specifications", children: <ModelSpecificationPage /> },
    { key: "devicemaster", label: "Device Master", children: <DeviceMaster /> },

    { key: "device", label: "Device Detail", children: <DeviceDetail /> },
    { key: "device-rack-location", label: "Device Rack Location", children: <DeviceRackLocationPage /> },
    { key: "networkconnection", label: "Network Connection", children: <NetworkConnection /> },

    { key: "deviceconconfig", label: "Connection Config", children: <DeviceConnectionConfig /> },
];

// ✅ CHANGE #4: har top-level tab ka "sub-items list + default sub-tab" ek jagah
// map kiya, taake generic helper se easily activeKey nikaal sakein
const NESTED_GROUPS = {
    area: { items: AREA_ITEMS, defaultKey: AREA_ITEMS[0].key },
    "device-group": { items: DEVICE_ITEMS, defaultKey: DEVICE_ITEMS[0].key },
};

const MasterDashboard = () => {
    // ─────────────────────────────────────────────
    // ✅ CHANGE #5: URL se hi state derive hoti hai — koi separate
    // useState nahi chahiye. Refresh hone par URL wahi rehta hai,
    // isliye activeTab automatically sahi value uthayega.
    // ─────────────────────────────────────────────
    const [searchParams, setSearchParams] = useSearchParams();

    const activeTopTab = searchParams.get(QUERY_KEYS.TOP) || DEFAULT_TOP_TAB;

    // Current top tab ke hisaab se sub-tab default nikal lo
    const currentGroup = NESTED_GROUPS[activeTopTab];
    const activeSubTab =
        searchParams.get(QUERY_KEYS.SUB) || currentGroup?.defaultKey;

    // ─────────────────────────────────────────────
    // ✅ CHANGE #6: Top-level tab change hone par — naya "tab" set karo,
    // aur us tab ka default "subtab" bhi set kar do (agar nested group hai),
    // taake purani group ka subtab naye group par leak na ho.
    // ─────────────────────────────────────────────
    const handleTopTabChange = useCallback(
        (key) => {
            const group = NESTED_GROUPS[key];
            const next = { [QUERY_KEYS.TOP]: key };
            if (group) next[QUERY_KEYS.SUB] = group.defaultKey;
            setSearchParams(next);
        },
        [setSearchParams]
    );

    // ─────────────────────────────────────────────
    // ✅ CHANGE #7: Nested sub-tab change hone par — "tab" wahi rakho,
    // sirf "subtab" update karo.
    // ─────────────────────────────────────────────
    const handleSubTabChange = useCallback(
        (key) => {
            setSearchParams({ [QUERY_KEYS.TOP]: activeTopTab, [QUERY_KEYS.SUB]: key });
        },
        [activeTopTab, setSearchParams]
    );

    const items = [
        {
            key: "area",
            label: (
                <span>
                    <BorderOutlined style={{ marginRight: 6 }} />
                    Area
                </span>
            ),
            // ✅ CHANGE #8: activeKey/onChange NestedTabGroup ko pass kiya
            children: (
                <NestedTabGroup
                    items={AREA_ITEMS}
                    activeKey={activeTopTab === "area" ? activeSubTab : undefined}
                    onChange={handleSubTabChange}
                />
            ),
        },
        {
            key: "tenant",
            label: (
                <span>
                    <TeamOutlined style={{ marginRight: 6 }} />
                    Company
                </span>
            ),
            children: <Company />,
        },
        {
            key: "device-group",
            label: (
                <span>
                    <DatabaseOutlined style={{ marginRight: 2 }} />
                    Device
                </span>
            ),
            // ✅ CHANGE #8 (contd.)
            children: (
                <NestedTabGroup
                    items={DEVICE_ITEMS}
                    activeKey={activeTopTab === "device-group" ? activeSubTab : undefined}
                    onChange={handleSubTabChange}
                />
            ),
        },
        // User Management (User API) stays out until the real login is switched on;
        // the static User and Role pages DCIM already had are kept instead.
        {
            key: "user",
            label: (
                <span>
                    <UserOutlined style={{ marginRight: 6 }} />
                    User
                </span>
            ),
            children: <AddUser />,
        },
        {
            key: "role",
            label: (
                <span>
                    <UserOutlined style={{ marginRight: 6 }} />
                    Role
                </span>
            ),
            children: <AddRole />,
        },
        {
            key: "dataCenter",
            label: (
                <span>
                    <CloudServerOutlined style={{ marginRight: 6 }} />
                    Data Center
                </span>
            ),
            children: <AddDataCenter />,
        },
        {
            key: "service",
            label: (
                <span>
                    <CustomerServiceOutlined style={{ marginRight: 6 }} />
                    Service
                </span>
            ),
            children: <AddService />,
        },
        {
            key: "rule-engine",
            label: (
                <span>
                    <CustomerServiceOutlined style={{ marginRight: 6 }} />
                    Rule Engine
                </span>
            ),
            children: <RulesEngine />,
        },
        {
            key: "room",
            label: (
                <span>
                    <ApartmentOutlined style={{ marginRight: 6 }} />
                    Room
                </span>
            ),
            children: <RoomManager />,
        },

        {
            key: "floor",
            label: (
                <span>
                    <ApartmentOutlined style={{ marginRight: 6 }} />
                    Floor
                </span>
            ),
            children: <AddFloor />,
        },
        {
            key: "rack",
            label: (
                <span>
                    <ApartmentOutlined style={{ marginRight: 6 }} />
                    Rack
                </span>
            ),
            children: <RackPage />,
        },

        {
            key: "rackpowcap",
            label: (
                <span>
                    <ApartmentOutlined style={{ marginRight: 6 }} />
                    Rack Power Capacity
                </span>
            ),
            children: <RackPowerCapacityPage />,
        },


    ];

    return (
        <div
            style={{
                height: "100vh",
                width: "100%",
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#f5f7fb",
                boxSizing: "border-box",
                overflow: "hidden",
                // Wide tables (Device Detail, Model Specifications…) scroll inside the
                // page instead of widening the layout past the right edge of the screen.
                contain: "inline-size",
            }}
        >
            <Tabs
                activeKey={activeTopTab}          // ✅ CHANGE #9: defaultActiveKey ki jagah controlled activeKey
                onChange={handleTopTabChange}     // ✅ CHANGE #9 (contd.): onChange handler
                items={items}
                type="card"
                size="middle"
                className="master-top-tabs"
            />

            <style>{`

/* ─────────────────────────────────────
   MASTER TOP TABS
   ───────────────────────────────────── */

.master-top-tabs {
    height: 100%;
    width: 100%;
    min-width: 0;
    max-width: 100%;

    display: flex;
    flex-direction: column;

    overflow: hidden;
}


/* ================================
   FIXED MASTER HEADER
   ================================ */

.master-top-tabs > .ant-tabs-nav {
    flex: 0 0 auto;

    width: 100%;
    min-width: 0;
    max-width: 100%;

    margin: 0;
    padding: 8px 6px 0;

    background: #ffffff;

    border-bottom: 1px solid #e8ecf3;

    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);

    position: relative;
    z-index: 0;

    overflow: hidden;
}


/* ─────────────────────────────────────
   HEADER TAB WRAPPER
   ───────────────────────────────────── */

.master-top-tabs > .ant-tabs-nav .ant-tabs-nav-wrap {
    width: 100%;
    min-width: 0;
    max-width: 100%;

    overflow-x: auto;
    overflow-y: hidden;
}


/* Tab list apni content width le sakti hai,
   lekin parent header ko expand nahi karegi */

.master-top-tabs > .ant-tabs-nav .ant-tabs-nav-list {
    flex: 0 0 auto;
    width: max-content;

    display: flex;
    gap: 4px;
}


/* Remove default border */

.master-top-tabs > .ant-tabs-nav::before {
  border-bottom: none !important;
}


/* ─────────────────────────────────────
   TOP TAB STYLE
   ───────────────────────────────────── */

.master-top-tabs .ant-tabs-tab {
  flex-shrink: 0;

  border-radius: 10px 10px 0 0 !important;
  border: 1px solid transparent !important;
  border-bottom: none !important;

  background: transparent !important;

  padding: 9px 16px !important;
  margin: 0 !important;

  font-size: 13px;
  color: #64748b;

  transition: all 0.2s ease;
}

.master-top-tabs .ant-tabs-tab:hover {
  color: #2563eb;
  background: #f5f9ff !important;
}

.master-top-tabs .ant-tabs-tab-active {
  background: linear-gradient(
    180deg,
    #eff6ff 0%,
    #f7faff 100%
  ) !important;

  border-color: #dbeafe #dbeafe transparent !important;

  box-shadow: 0 -2px 6px rgba(37, 99, 235, 0.06);
}

.master-top-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
  color: #2563eb !important;
  font-weight: 600 !important;
}

.master-top-tabs .ant-tabs-ink-bar {
  background: #2563eb !important;
  height: 2.5px !important;
  border-radius: 2px;
}


/* ─────────────────────────────────────
   CONTENT
   ───────────────────────────────────── */

.master-top-tabs > .ant-tabs-content-holder {
    flex: 1 1 auto;

    width: 100%;
    min-width: 0;
    max-width: 100%;

    min-height: 0;

    overflow-x: auto;
    overflow-y: auto;

    padding: 14px 6px;

    box-sizing: border-box;
}


.master-top-tabs .ant-tabs-content {
    min-width: 0;
}

.master-top-tabs .ant-tabs-tabpane {
    min-width: 0;
    max-width: 100%;
}


/* ─────────────────────────────────────
   SCROLLBAR
   ───────────────────────────────────── */

.master-top-tabs > .ant-tabs-content-holder::-webkit-scrollbar {
  width: 7px;
  height: 7px;
}

.master-top-tabs > .ant-tabs-content-holder::-webkit-scrollbar-track {
  background: transparent;
}

.master-top-tabs > .ant-tabs-content-holder::-webkit-scrollbar-thumb {
  background: #d6dce6;
  border-radius: 8px;
}

.master-top-tabs > .ant-tabs-content-holder::-webkit-scrollbar-thumb:hover {
  background: #bcc4d1;
}


/* Header horizontal scrollbar */

.master-top-tabs > .ant-tabs-nav .ant-tabs-nav-wrap::-webkit-scrollbar {
  height: 5px;
}

.master-top-tabs > .ant-tabs-nav .ant-tabs-nav-wrap::-webkit-scrollbar-track {
  background: transparent;
}

.master-top-tabs > .ant-tabs-nav .ant-tabs-nav-wrap::-webkit-scrollbar-thumb {
  background: #d6dce6;
  border-radius: 8px;
}

`}</style>
        </div>
    );
};

export default MasterDashboard;