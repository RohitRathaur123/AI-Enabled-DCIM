import React, { useCallback } from "react";
import { Tabs } from "antd";
import { useSearchParams } from "react-router-dom";
import { SolutionOutlined, FieldTimeOutlined, DeploymentUnitOutlined } from "@ant-design/icons";
import TicketManagement from "./TicketManagement";
import Sla from "./sla";
import EsclationMatrix from "./escalationmatrix";
import EmailTemplateManager from "./emailtemplatemanager";
import WorkOrderTemplates from "./workorderTemplates";
// Tickets raised by the 5D View (this month's list + simulation failures).
// They live in the local ticket store, not in the Ticket API.
import DcimTicketManagement from "../pages/TicketManagement";

// URL query param: /ticket?tab=sla
const QUERY_KEY = "tab";
const DEFAULT_TAB = "tickets";
const DCIM_TAB = "dcim-tickets";

const TicketDashboard = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    // "Open in Ticket Management" from a 5D View ticket pop-up sends ?focus=<ticket no>,
    // which belongs to the 5D View tickets tab.
    const focus = searchParams.get("focus");
    const activeTab = searchParams.get(QUERY_KEY) || (focus ? DCIM_TAB : DEFAULT_TAB);

    const handleTabChange = useCallback(
        (key) => {
            setSearchParams({ [QUERY_KEY]: key });
        },
        [setSearchParams]
    );

    const items = [
        {
            key: "tickets",
            label: (
                <span>
                    <SolutionOutlined style={{ marginRight: 6 }} />
                    Tickets
                </span>
            ),
            children: <TicketManagement />,
        },
        {
            key: "sla",
            label: (
                <span>
                    <FieldTimeOutlined style={{ marginRight: 6 }} />
                    SLA
                </span>
            ),
            children: <Sla />,
        },
        {
            key: "escalation",
            label: (
                <span>
                    <FieldTimeOutlined style={{ marginRight: 6 }} />
                    Escalation
                </span>
            ),
            children: <EsclationMatrix />,
        },
        {
            key: "workordertemplates",
            label: (
                <span>
                    <FieldTimeOutlined style={{ marginRight: 6 }} />
                    Work Order Templates
                </span>
            ),
            children: <WorkOrderTemplates />,
        },
        {
            key: "emailtemplatemanager",
            label: (
                <span>
                    <FieldTimeOutlined style={{ marginRight: 6 }} />
                    Email Templates
                </span>
            ),
            children: <EmailTemplateManager />,
        },
        {
            key: DCIM_TAB,
            label: (
                <span>
                    <DeploymentUnitOutlined style={{ marginRight: 6 }} />
                    5D View Tickets
                </span>
            ),
            children: <DcimTicketManagement />,
        },
    ];

    return (
        // contain: inline-size keeps wide tables scrolling inside the tab instead of
        // widening the layout past the right edge of the screen.
        <div style={{ height: "100vh", width: "100%", contain: "inline-size", overflow: "hidden", backgroundColor: "#f0f2f5", padding: "10px 16px", boxSizing: "border-box" }}>
            <Tabs
                activeKey={activeTab}
                onChange={handleTabChange}
                items={items}
                type="card"
                size="small"
            />
        </div>
    );
};

export default TicketDashboard;
