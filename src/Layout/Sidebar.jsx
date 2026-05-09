// import React, { useState, useEffect, useRef, useCallback } from "react";
// import ReactDOM from "react-dom";
// import { Link, useLocation, useNavigate } from "react-router-dom";
// import { Layout, Menu, Input, Tooltip } from "antd";
// import { useAuth } from "../Authentication/AuthContext";
// import {
//   DashboardOutlined,
//   SettingOutlined,
//   AlertOutlined,
//   PlusCircleFilled,
//   CaretDownOutlined,
//   BankOutlined,
//   AimOutlined,
//   PlusOutlined,
//   DeleteOutlined,
//   EyeFilled,
//   ApartmentOutlined,
//   NodeIndexOutlined,
//   AppstoreOutlined,
//   CloseOutlined,
//   SearchOutlined,
//   DragOutlined,
//   CreditCardOutlined,
//   EnvironmentOutlined,
//   SafetyCertificateOutlined,
//   DatabaseOutlined,
//   ThunderboltOutlined,
//   CloudOutlined,
//   WifiOutlined,
//   BellOutlined,
//   LineChartOutlined,
//   BulbOutlined,
//   SwapOutlined,
//   RobotOutlined,
//   BuildOutlined,
//   TeamOutlined,
//   AuditOutlined,
//   ApiOutlined,
//   HeatMapOutlined,
//   ControlOutlined,
//   InboxOutlined,
//   TagsOutlined,
//   ClusterOutlined,
//   ShopOutlined,
//   HistoryOutlined,
//   FileTextOutlined,
//   RightOutlined,

//   GlobalOutlined,
//   HomeOutlined,
//   UserOutlined,
//   CloudServerOutlined,
//   BorderOutlined,
//   CustomerServiceOutlined
// } from "@ant-design/icons";
// import Logo from "../assets/3879707.png";

// const { Sider } = Layout;

// const SIDEBAR_WIDTH     = 270;
// const SIDEBAR_COLLAPSED = 72;
// const TOOLBOX_WIDTH     = 310;
// const ICON_SIZE         = 20;

// const DEFAULT_ROOMS = [
//   { id: 0, name: "Server Room",  icon: "server",    color: "#3498db", width: 20, length: 20, height: 8 },
//   { id: 1, name: "AC Unit Room", icon: "snowflake", color: "#2ecc71", width: 20, length: 20, height: 8 },
//   { id: 2, name: "DG Set Room",  icon: "bolt",      color: "#e67e22", width: 20, length: 20, height: 8 },
// ];

// const DEVICE_TYPES = [
//   { name: "Server Rack",    icon: "fa-server",           color: "#3498db", category: "Compute",     power: "1-5kW"    },
//   { name: "Blade Server",   icon: "fa-sitemap",          color: "#2980b9", category: "Compute",     power: "0.5-2kW"  },
//   { name: "AC Unit",        icon: "fa-snowflake",        color: "#2ecc71", category: "Cooling",     power: "5-20kW"   },
//   { name: "Chiller",        icon: "fa-fan",              color: "#16a085", category: "Cooling",     power: "10-100kW" },
//   { name: "CRAC Unit",      icon: "fa-temperature-low",  color: "#1abc9c", category: "Cooling",     power: "5-30kW"   },
//   { name: "DG Set",         icon: "fa-bolt",             color: "#e67e22", category: "Power",       power: "50-500kW" },
//   { name: "UPS",            icon: "fa-car-battery",      color: "#f39c12", category: "Power",       power: "1-100kVA" },
//   { name: "PDU",            icon: "fa-plug",             color: "#1abc9c", category: "Power",       power: "10-100A"  },
//   { name: "Network Switch", icon: "fa-network-wired",    color: "#9b59b6", category: "Network",     power: "100-500W" },
//   { name: "Router",         icon: "fa-route",            color: "#e74c3c", category: "Network",     power: "50-300W"  },
//   { name: "Firewall",       icon: "fa-shield-alt",       color: "#c0392b", category: "Security",    power: "100-400W" },
//   { name: "Storage Array",  icon: "fa-hdd",              color: "#34495e", category: "Storage",     power: "1-10kW"   },
//   { name: "CCTV Camera",    icon: "fa-video",            color: "#8e44ad", category: "Security",    power: "20-50W"   },
//   { name: "FM200 System",   icon: "fa-fire",             color: "#f39c12", category: "Safety",      power: "200-500W" },
//   { name: "Humidifier",     icon: "fa-tint",             color: "#3498db", category: "Environment", power: "0.5-5kW"  },
// ];

// const CATEGORY_COLORS = {
//   Compute: "#3498db", Cooling: "#2ecc71", Power: "#f39c12",
//   Network: "#9b59b6", Security: "#e74c3c", Storage: "#34495e",
//   Safety: "#e67e22",  Environment: "#1abc9c",
// };

// const dcimBus = {
//   emit(event, data) {
//     window.dispatchEvent(new CustomEvent(`dcim:${event}`, { detail: data }));
//   },
// };

// let globalDragActive = false;

// const useFontAwesome = () => {
//   useEffect(() => {
//     if (!document.getElementById("fa-cdn")) {
//       const link = document.createElement("link");
//       link.id   = "fa-cdn";
//       link.rel  = "stylesheet";
//       link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
//       document.head.appendChild(link);
//     }
//   }, []);
// };

// function buildDragHandlers(payload, elRef) {
//   return {
//     onDragStart(e) {
//       globalDragActive = true;
//       const json = JSON.stringify(payload);
//       e.dataTransfer.setData("text/plain", json);
//       e.dataTransfer.effectAllowed = "copy";
//       window.dispatchEvent(new CustomEvent("dcim:dragStart", { detail: payload }));
//       if (elRef?.current) elRef.current.style.opacity = "0.5";
//     },
//     onDragEnd(e) {
//       globalDragActive = false;
//       window.dispatchEvent(new CustomEvent("dcim:dragEnd"));
//       if (elRef?.current) {
//         elRef.current.style.opacity = "1";
//         elRef.current.style.transform = "scale(1)";
//       }
//     },
//   };
// }

// const DeviceTileLarge = ({ dt }) => {
//   const ref = useRef(null);
//   const { onDragStart, onDragEnd } = buildDragHandlers({ ...dt, targetRoomId: null }, ref);
//   return (
//     <Tooltip title={`${dt.name} · ${dt.power}`} placement="top" mouseEnterDelay={0.2}>
//       <div ref={ref} draggable onDragStart={onDragStart} onDragEnd={onDragEnd}
//         style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "10px 4px 8px", borderRadius: 10, background: `${dt.color}0e`, border: `1.5px solid ${dt.color}22`, cursor: "grab", transition: "all 0.15s ease", userSelect: "none" }}
//         onMouseEnter={e => { e.currentTarget.style.background = `${dt.color}20`; e.currentTarget.style.border = `1.5px solid ${dt.color}60`; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 16px ${dt.color}28`; }}
//         onMouseLeave={e => { e.currentTarget.style.background = `${dt.color}0e`; e.currentTarget.style.border = `1.5px solid ${dt.color}22`; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
//       >
//         <div style={{ width: 42, height: 42, borderRadius: 11, background: `${dt.color}18`, border: `1px solid ${dt.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
//           <i className={`fas ${dt.icon}`} style={{ color: dt.color, fontSize: 19, pointerEvents: "none" }} />
//         </div>
//         <span style={{ fontSize: 9.5, fontWeight: 600, color: "#374151", textAlign: "center", lineHeight: 1.3, maxWidth: 62, wordBreak: "break-word" }}>{dt.name}</span>
//       </div>
//     </Tooltip>
//   );
// };

// const DeviceTileSmall = ({ dt, roomId }) => {
//   const ref = useRef(null);
//   const { onDragStart, onDragEnd } = buildDragHandlers({ ...dt, targetRoomId: roomId }, ref);
//   return (
//     <Tooltip title={`${dt.name} · ${dt.power}`} placement="top" mouseEnterDelay={0.2}>
//       <div ref={ref} draggable onDragStart={onDragStart} onDragEnd={onDragEnd}
//         style={{ width: 36, height: 36, borderRadius: 8, background: `${dt.color}12`, border: `1.5px solid ${dt.color}28`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "grab", transition: "all 0.13s ease", flexShrink: 0 }}
//         onMouseEnter={e => { e.currentTarget.style.background = `${dt.color}26`; e.currentTarget.style.border = `1.5px solid ${dt.color}70`; e.currentTarget.style.transform = "scale(1.1)"; }}
//         onMouseLeave={e => { e.currentTarget.style.background = `${dt.color}12`; e.currentTarget.style.border = `1.5px solid ${dt.color}28`; e.currentTarget.style.transform = "scale(1)"; }}
//       >
//         <i className={`fas ${dt.icon}`} style={{ color: dt.color, fontSize: 14, pointerEvents: "none" }} />
//       </div>
//     </Tooltip>
//   );
// };

// const RoomDevicePanel = ({ room }) => {
//   const [roomSearch, setRoomSearch] = useState("");
//   const c = room.hex || room.color;
//   const filtered = DEVICE_TYPES.filter(d =>
//     d.name.toLowerCase().includes(roomSearch.toLowerCase()) ||
//     d.category.toLowerCase().includes(roomSearch.toLowerCase())
//   );
//   return (
//     <div style={{ padding: "4px 10px 12px", borderTop: `1px solid ${c}20` }}>
//       <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.6px", margin: "7px 0 8px" }}>Drag a device into the 3D viewer ↓</div>
//       <div style={{ position: "relative", marginBottom: 8 }}>
//         <SearchOutlined style={{ position: "absolute", left: 7, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 11, pointerEvents: "none" }} />
//         <input type="text" placeholder="Filter devices…" value={roomSearch} onChange={e => setRoomSearch(e.target.value)} onClick={e => e.stopPropagation()}
//           style={{ width: "100%", padding: "5px 26px 5px 24px", borderRadius: 7, border: `1px solid ${c}30`, fontSize: 11, outline: "none", background: `${c}08`, color: "#1e293b", boxSizing: "border-box" }} />
//         {roomSearch && <button onClick={e => { e.stopPropagation(); setRoomSearch(""); }} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 10, padding: 0, lineHeight: 1 }}>✕</button>}
//       </div>
//       {filtered.length > 0
//         ? <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>{filtered.map(dt => <DeviceTileSmall key={dt.name} dt={dt} roomId={room.id} />)}</div>
//         : <div style={{ textAlign: "center", padding: "10px 0", color: "#94a3b8", fontSize: 11 }}>No devices match "{roomSearch}"</div>}
//     </div>
//   );
// };

// const GlowIcon = ({ icon: Icon, glowColor = "#2563eb", isActive = false }) => (
//   <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
//     {isActive && <div style={{ position: "absolute", inset: -1, borderRadius: "50%", background: `radial-gradient(circle, ${glowColor}26 0%, transparent 80%)`, filter: "blur(2px)", zIndex: 0 }} />}
//     <Icon style={{ fontSize: ICON_SIZE, color: isActive ? glowColor : "#64748b", zIndex: 1 }} />
//   </div>
// );

// const MenuLabel = ({ children, isCollapsed }) =>
//   isCollapsed ? null : (
//     <span style={{ color: "#1e293b", marginLeft: 13, fontSize: 15, fontWeight: 500, whiteSpace: "nowrap" }}>{children}</span>
//   );

// // ─────────────────────────────────────────────────────────────────────────────
// // ASSET SUBMENU ITEMS (nested under Core Infrastructure → Asset)
// // ─────────────────────────────────────────────────────────────────────────────
// const ASSET_SUB_ITEMS = [
//   { key: "asset-dashboard",  icon: DashboardOutlined,   label: "Dashboard",          to: "/asset-dashboard"      },
//   { key: "add-device",       icon: InboxOutlined,   label: "Onboarding",          to: "/add-device"       },
//   { key: "add-device-type",  icon: TagsOutlined,    label: "Type",                to: "/add-device-type"  },
//   { key: "device-category",  icon: ApartmentOutlined, label: "Category",          to: "/device-category"  },
//   { key: "add-company",      icon: ShopOutlined,    label: "Manufacturer",        to: "/add-manufacturer" },
//   // { key: "life-cycle",       icon: HistoryOutlined, label: "Life Cycle (Stages)", to: "/life-cycle"       },
//   { key: "modal-specs",      icon: FileTextOutlined,label: "Model Specifications", to: "/modal-specs"      },
// ];

// const AREA_SUB_ITEMS = [
//   { key: "country", icon: GlobalOutlined,   label: "Country", to: "/add-country" },
//   { key: "state",  icon: EnvironmentOutlined, label: "State", to: "/add-state"  },
//   { key: "city",  icon: BankOutlined, label: "City", to: "/add-city"  },
//   // { key: "location",  icon: HomeOutlined, label: "Location", to: "/add-location"  },
//   { key: "site",  icon: BankOutlined, label: "Site", to: "/add-site"  },
// ];

// // ─────────────────────────────────────────────────────────────────────────────
// // CORE INFRASTRUCTURE SUB-ITEMS (with Asset as a nested group)
// // ─────────────────────────────────────────────────────────────────────────────
// const CORE_INFRASTRUCTURE_SUB_ITEMS = [
//   { key: "asset-group",      icon: DatabaseOutlined,    label: "Asset",              isGroup: true, children: ASSET_SUB_ITEMS },
//   { key: "rack",             icon: ControlOutlined,     label: "Rack",               to: "/rack"              },
//   { key: "power",            icon: ThunderboltOutlined, label: "Power",              to: "/power"             },
//   { key: "cooling-thermal",  icon: CloudOutlined,       label: "Cooling and Thermal", to: "/cooling-thermal"  },
// ];

// const MONITORING_OPERATIONS_SUB_ITEMS = [
//   { key: "environment",      icon: EnvironmentOutlined, label: "Environment",        to: "/environment"       },
//   { key: "network-it",       icon: WifiOutlined,        label: "Network and IT",     to: "/network-it"        },
//   { key: "alarms-event",     icon: BellOutlined,        label: "Alarms & Event",     to: "/alarms-event"      },
// ];

// const PLANNING_OPTIMIZATION_SUB_ITEMS = [
//   { key: "capacity-planning",  icon: LineChartOutlined, label: "Capacity Planning",  to: "/capacity-planning" },
//   { key: "energy-efficiency",  icon: BulbOutlined,      label: "Energy Efficiency",  to: "/energy-efficiency" },
//   { key: "change-management",  icon: SwapOutlined,      label: "Change Management",  to: "/change-management" },
// ];

// const INTELLIGENCE_ANALYSIS_SUB_ITEMS = [
//   { key: "ai-predictive",    icon: RobotOutlined,       label: "AI & Predictive Maintenance", to: "/ai-predictive"   },
//   { key: "digital-twin",     icon: BuildOutlined,       label: "Digital Twin modules",        to: "/digital-twin"    },
// ];

// const GOVERNANCE_ENTERPRISE_SUB_ITEMS = [
//   { key: "multi-tenant",     icon: TeamOutlined,        label: "Multi-Tenant & Access Control", to: "/multi-tenant"  },
//   { key: "compliance",       icon: AuditOutlined,       label: "Compliance & Reporting",        to: "/compliance"    },
//   { key: "integration-api",  icon: ApiOutlined,         label: "Integration & API",             to: "/integration-api"},
// ];

// const PACKAGES_SUB_ITEMS = [
//   { key: "packages", icon: AppstoreOutlined,   label: "Package", to: "/packages" },
//   { key: "billing",  icon: CreditCardOutlined, label: "Billing", to: "/billing"  },
// ];
// const PACKAGES_SUB_ITEMS_MASTER = [
//   { key: "area", icon: BorderOutlined,   label: "Area", isGroup: true, children: AREA_SUB_ITEMS },
//   { key: "tenant",  icon: TeamOutlined, label: "Tenant", to: "/add-tenant"  },
//   { key: "user",  icon: UserOutlined, label: "User", to: "/add-user"  },
//   { key: "role",  icon: UserOutlined, label: "Role", to: "/add-role"  },
//   { key: "dataCenter",  icon: CloudServerOutlined, label: "DataCenter", to: "/add-datacenter"  },
//   { key: "service",  icon: CustomerServiceOutlined, label: "Service", to: "/add-service"  },
//   // { key: "room",  icon: ApartmentOutlined, label: "Room", to: "/add-room"  },
// ];

// // ─────────────────────────────────────────────────────────────────────────────
// // NESTED GROUP ITEM — renders a collapsible sub-group inside a SubDropdown
// // ─────────────────────────────────────────────────────────────────────────────
// const NestedGroupItem = ({ item, pathname, accent }) => {
//   const isAnyChildActive = item.children.some(c => pathname === c.to);
//   const [open, setOpen] = useState(isAnyChildActive);

//   useEffect(() => { if (isAnyChildActive) setOpen(true); }, [pathname]);

//   return (
//     <div style={{ margin: "1px 0" }}>
//       {/* Group header row */}
//       <div
//         onClick={() => setOpen(p => !p)}
//         style={{
//           position: "relative", display: "flex", alignItems: "center", gap: 8,
//           padding: "0 10px 0 42px", height: 40, margin: "1px 0 1px 4px",
//           borderRadius: 8,
//           borderLeft: isAnyChildActive && !open ? `3px solid ${accent}` : "3px solid transparent",
//           background: isAnyChildActive && !open ? "linear-gradient(90deg, #dbeafe 40%, #f1f5fa 100%)" : "transparent",
//           transition: "all 0.15s", cursor: "pointer", userSelect: "none",
//         }}
//         onMouseEnter={e => { e.currentTarget.style.background = "#f1f5fa"; }}
//         onMouseLeave={e => { e.currentTarget.style.background = isAnyChildActive && !open ? "linear-gradient(90deg, #dbeafe 40%, #f1f5fa 100%)" : "transparent"; }}
//       >
//         {/* dot + connector */}
//         <div style={{ position: "absolute", left: 22, top: "50%", width: 6, height: 6, borderRadius: "50%", background: isAnyChildActive ? accent : "#e2e8f0", border: `1.5px solid ${isAnyChildActive ? accent : "#cbd5e1"}`, transform: "translate(-50%, -50%)", zIndex: 1, transition: "all 0.15s" }} />
//         <div style={{ position: "absolute", left: 28, top: "50%", width: 10, height: 1.5, borderRadius: 2, background: isAnyChildActive ? `${accent}80` : "#e2e8f0", transform: "translateY(-50%)", transition: "background 0.15s" }} />
//         <item.icon style={{ fontSize: 13, color: isAnyChildActive ? accent : "#64748b", flexShrink: 0, transition: "color 0.15s" }} />
//         <span style={{ flex: 1, fontSize: 13, fontWeight: isAnyChildActive ? 600 : 400, color: isAnyChildActive ? accent : "#000000", whiteSpace: "nowrap", transition: "all 0.15s" }}>{item.label}</span>
//         <CaretDownOutlined style={{ fontSize: 9, color: "#94a3b8", transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.22s cubic-bezier(.4,0,.2,1)", marginRight: 4 }} />
//       </div>

//       {/* Children */}
//       <div style={{ overflow: "hidden", maxHeight: open ? `${item.children.length * 38}px` : "0px", transition: "max-height 0.25s cubic-bezier(.4,0,.2,1)", opacity: open ? 1 : 0, transitionProperty: "max-height, opacity" }}>
//         <div style={{ position: "relative", paddingTop: 2, paddingBottom: 2 }}>
//           {/* deep connector line */}
//           <div style={{ position: "absolute", left: 38, top: 6, bottom: 6, width: 1.5, borderRadius: 2, background: "linear-gradient(to bottom, #cbd5e1 0%, #e2e8f0 100%)" }} />
//           {item.children.map(child => {
//             const isActive = pathname === child.to;
//             const Icon = child.icon;
//             return (
//               <Link key={child.key} to={child.to} style={{ textDecoration: "none", display: "block" }}>
//                 <div
//                   style={{
//                     position: "relative", display: "flex", alignItems: "center", gap: 8,
//                     padding: "0 10px 0 58px", height: 36, margin: "1px 0 1px 4px",
//                     borderRadius: 8,
//                     borderLeft: isActive ? `3px solid ${accent}` : "3px solid transparent",
//                     background: isActive ? "linear-gradient(90deg, #dbeafe 40%, #f1f5fa 100%)" : "transparent",
//                     transition: "all 0.15s",
//                   }}
//                   onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f1f5fa"; }}
//                   onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
//                 >
//                   <div style={{ position: "absolute", left: 34, top: "50%", width: 6, height: 6, borderRadius: "50%", background: isActive ? accent : "#e2e8f0", border: `1.5px solid ${isActive ? accent : "#cbd5e1"}`, transform: "translate(-50%, -50%)", zIndex: 1, transition: "all 0.15s" }} />
//                   <div style={{ position: "absolute", left: 40, top: "50%", width: 10, height: 1.5, borderRadius: 2, background: isActive ? `${accent}80` : "#e2e8f0", transform: "translateY(-50%)", transition: "background 0.15s" }} />
//                   <Icon style={{ fontSize: 12, color: isActive ? accent : "#94a3b8", flexShrink: 0, transition: "color 0.15s" }} />
//                   <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, color: isActive ? accent : "#000000", whiteSpace: "nowrap", transition: "all 0.15s" }}>{child.label}</span>
//                 </div>
//               </Link>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // REUSABLE SUB-DROPDOWN — supports flat items AND nested group items
// // ─────────────────────────────────────────────────────────────────────────────
// const SubDropdown = ({ label, headerIcon: HeaderIcon, subItems, collapsed, pathname }) => {
//   const accent = "#3b82f6";

//   // Check active across flat items and group children
//   const isAnyActive = subItems.some(i => {
//     if (i.isGroup) return i.children.some(c => pathname === c.to);
//     return pathname === i.to;
//   });

//   const [open, setOpen] = useState(isAnyActive);
//   useEffect(() => { if (isAnyActive) setOpen(true); }, [pathname]);

//   // Calculate max-height for animation: groups count their children too
//   const itemCount = subItems.reduce((acc, i) => {
//     if (i.isGroup) return acc + 1 + i.children.length;
//     return acc + 1;
//   }, 0);

//   if (collapsed) {
//     return (
//       <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "2px 0" }}>
//         <Tooltip title={label} placement="right">
//           <div onClick={() => setOpen(p => !p)}
//             style={{ width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: isAnyActive ? `${accent}18` : "transparent", transition: "all 0.15s", marginBottom: 2 }}
//             onMouseEnter={e => { e.currentTarget.style.background = "#f0f7ff"; }}
//             onMouseLeave={e => { e.currentTarget.style.background = isAnyActive ? `${accent}18` : "transparent"; }}
//           >
//             <HeaderIcon style={{ fontSize: 18, color: isAnyActive ? accent : "#64748b" }} />
//           </div>
//         </Tooltip>
//         {subItems.map(item => {
//           if (item.isGroup) {
//             return item.children.map(child => {
//               const isActive = pathname === child.to;
//               const Icon = child.icon;
//               return (
//                 <Tooltip key={child.key} title={child.label} placement="right">
//                   <Link to={child.to}>
//                     <div style={{ width: 36, height: 36, borderRadius: 8, margin: "1px auto", display: "flex", alignItems: "center", justifyContent: "center", background: isActive ? `${accent}18` : "transparent", transition: "all 0.15s" }}
//                       onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f0f7ff"; }}
//                       onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
//                     >
//                       <Icon style={{ fontSize: 13, color: isActive ? accent : "#64748b" }} />
//                     </div>
//                   </Link>
//                 </Tooltip>
//               );
//             });
//           }
//           const isActive = pathname === item.to;
//           const Icon = item.icon;
//           return (
//             <Tooltip key={item.key} title={item.label} placement="right">
//               <Link to={item.to}>
//                 <div style={{ width: 36, height: 36, borderRadius: 8, margin: "1px auto", display: "flex", alignItems: "center", justifyContent: "center", background: isActive ? `${accent}18` : "transparent", transition: "all 0.15s" }}
//                   onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f0f7ff"; }}
//                   onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
//                 >
//                   <Icon style={{ fontSize: 13, color: isActive ? accent : "#64748b" }} />
//                 </div>
//               </Link>
//             </Tooltip>
//           );
//         })}
//       </div>
//     );
//   }

//   return (
//     <div style={{ margin: "2px 4px" }}>
//       {/* Section header */}
//       <div onClick={() => setOpen(p => !p)}
//         style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 0 14px", height: 42, borderRadius: 8, cursor: "pointer", userSelect: "none", transition: "all 0.15s", background: isAnyActive && !open ? "linear-gradient(90deg, #dbeafe 40%, #f1f5fa 100%)" : "transparent", borderLeft: isAnyActive && !open ? `3px solid ${accent}` : "3px solid transparent" }}
//         onMouseEnter={e => { e.currentTarget.style.background = "#f1f5fa"; }}
//         onMouseLeave={e => { e.currentTarget.style.background = isAnyActive && !open ? "linear-gradient(90deg, #dbeafe 40%, #f1f5fa 100%)" : "transparent"; }}
//       >
//         <GlowIcon icon={HeaderIcon} glowColor={accent} isActive={isAnyActive} />
//         <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: isAnyActive ? accent : "#1e293b", whiteSpace: "nowrap" }}>{label}</span>
//         <CaretDownOutlined style={{ fontSize: 10, color: "#94a3b8", transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.22s cubic-bezier(.4,0,.2,1)" }} />
//       </div>

//       {/* Animated body */}
//       <div style={{ overflow: "hidden", maxHeight: open ? `${itemCount * 46 + 20}px` : "0px", transition: "max-height 0.3s cubic-bezier(.4,0,.2,1)", opacity: open ? 1 : 0, transitionProperty: "max-height, opacity" }}>
//         <div style={{ position: "relative", paddingTop: 2, paddingBottom: 4 }}>
//           {/* vertical connector line */}
//           <div style={{ position: "absolute", left: 26, top: 10, bottom: 10, width: 1.5, borderRadius: 2, background: "linear-gradient(to bottom, #cbd5e1 0%, #e2e8f0 100%)" }} />

//           {subItems.map(item => {
//             if (item.isGroup) {
//               return <NestedGroupItem key={item.key} item={item} pathname={pathname} accent={accent} />;
//             }

//             const isActive = pathname === item.to;
//             const Icon = item.icon;
//             return (
//               <Link key={item.key} to={item.to} style={{ textDecoration: "none", display: "block" }}>
//                 <div
//                   style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, padding: "0 10px 0 42px", height: 40, margin: "1px 0 1px 4px", borderRadius: 8, borderLeft: isActive ? `3px solid ${accent}` : "3px solid transparent", background: isActive ? "linear-gradient(90deg, #dbeafe 40%, #f1f5fa 100%)" : "transparent", transition: "all 0.15s" }}
//                   onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f1f5fa"; }}
//                   onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
//                 >
//                   <div style={{ position: "absolute", left: 22, top: "50%", width: 6, height: 6, borderRadius: "50%", background: isActive ? accent : "#e2e8f0", border: `1.5px solid ${isActive ? accent : "#cbd5e1"}`, transform: "translate(-50%, -50%)", zIndex: 1, transition: "all 0.15s" }} />
//                   <div style={{ position: "absolute", left: 28, top: "50%", width: 10, height: 1.5, borderRadius: 2, background: isActive ? `${accent}80` : "#e2e8f0", transform: "translateY(-50%)", transition: "background 0.15s" }} />
//                   <Icon style={{ fontSize: 13, color: isActive ? accent : "#64748b", flexShrink: 0, transition: "color 0.15s" }} />
//                   <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? accent : "#000000", whiteSpace: "nowrap", transition: "all 0.15s" }}>{item.label}</span>
//                 </div>
//               </Link>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // DRAGGABLE FLOATING TOOLBOX PANEL
// // ─────────────────────────────────────────────────────────────────────────────
// const ToolboxPanel = ({ open, onClose, collapsed, rooms, onAddRoom, onDeleteRoom, onViewRoom }) => {
//   const [searchTerm,     setSearchTerm    ] = useState("");
//   const [categoryFilter, setCategoryFilter] = useState("All");
//   const [expandedRoom,   setExpandedRoom  ] = useState(null);
//   const [showAddModal,   setShowAddModal  ] = useState(false);
//   const [newRoom,        setNewRoom       ] = useState({ name: "", width: 20, length: 20, height: 8 });
//   const [isDragging,     setIsDragging    ] = useState(false);
//   const [deleteConfirm,  setDeleteConfirm ] = useState({ open: false, roomId: null, roomName: "" });

//   const sidebarEdge = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH;
//   const [panelPos, setPanelPos] = useState({ x: sidebarEdge + 12, y: 60 });
//   const [isMinimized, setIsMinimized] = useState(false);

//   const draggingPanel = useRef(false);
//   const dragOffset    = useRef({ x: 0, y: 0 });
//   const panelRef      = useRef(null);

//   useEffect(() => { setPanelPos(prev => ({ ...prev, x: sidebarEdge + 12 })); }, [sidebarEdge]);

//   useEffect(() => {
//     const onStart = () => setIsDragging(true);
//     const onEnd   = () => setIsDragging(false);
//     window.addEventListener("dcim:dragStart", onStart);
//     window.addEventListener("dcim:dragEnd",   onEnd);
//     return () => { window.removeEventListener("dcim:dragStart", onStart); window.removeEventListener("dcim:dragEnd", onEnd); };
//   }, []);

//   const onHeaderMouseDown = useCallback((e) => {
//     if (e.button !== 0) return;
//     if (e.target.closest("button") || e.target.closest("input")) return;
//     draggingPanel.current = true;
//     dragOffset.current = { x: e.clientX - panelPos.x, y: e.clientY - panelPos.y };
//     e.preventDefault();
//   }, [panelPos]);

//   useEffect(() => {
//     const onMouseMove = (e) => {
//       if (!draggingPanel.current) return;
//       const newX = Math.max(0, Math.min(window.innerWidth - TOOLBOX_WIDTH, e.clientX - dragOffset.current.x));
//       const newY = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffset.current.y));
//       setPanelPos({ x: newX, y: newY });
//     };
//     const onMouseUp = () => { draggingPanel.current = false; };
//     window.addEventListener("mousemove", onMouseMove);
//     window.addEventListener("mouseup",   onMouseUp);
//     return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
//   }, []);

//   const categories = ["All", ...Object.keys(CATEGORY_COLORS)];
//   const filteredDevices = DEVICE_TYPES.filter(d => {
//     const matchSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.category.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchCat = categoryFilter === "All" || d.category === categoryFilter;
//     return matchSearch && matchCat;
//   });

//   const handleAddRoom = () => {
//     if (!newRoom.name.trim()) { alert("Please enter a room name"); return; }
//     onAddRoom(newRoom);
//     setNewRoom({ name: "", width: 20, length: 20, height: 8 });
//     setShowAddModal(false);
//   };

//   const handleDeleteClick = (e, room) => { e.stopPropagation(); setDeleteConfirm({ open: true, roomId: room.id, roomName: room.name }); };
//   const confirmDelete = () => { onDeleteRoom(deleteConfirm.roomId); setExpandedRoom(prev => prev === deleteConfirm.roomId ? null : prev); setDeleteConfirm({ open: false, roomId: null, roomName: "" }); };
//   const cancelDelete  = () => setDeleteConfirm({ open: false, roomId: null, roomName: "" });
//   const closeAddModal = () => { setShowAddModal(false); setNewRoom({ name: "", width: 20, length: 20, height: 8 }); };

//   if (!open) return null;

//   return ReactDOM.createPortal(
//     <>
//       {!showAddModal && !deleteConfirm.open && (
//         <div onClick={isDragging ? undefined : onClose} style={{ position: "fixed", inset: 0, zIndex: 99998, pointerEvents: isDragging ? "none" : "all", background: "transparent" }} />
//       )}

//       <div ref={panelRef} style={{ position: "fixed", left: panelPos.x, top: panelPos.y, width: TOOLBOX_WIDTH, maxHeight: isMinimized ? 54 : "calc(100vh - 80px)", zIndex: 99999, display: "flex", flexDirection: "column", background: "linear-gradient(170deg, #ffffff 0%, #f7f9ff 100%)", border: "1px solid #e0e7f0", borderRadius: 14, boxShadow: "0 8px 40px rgba(59,130,246,0.15), 0 2px 12px rgba(0,0,0,0.10), 0 0 0 1px rgba(59,130,246,0.06)", overflow: "hidden", transition: "max-height 0.28s cubic-bezier(.4,0,.2,1), box-shadow 0.2s ease", pointerEvents: "all" }}>

//         {/* Header */}
//         <div onMouseDown={onHeaderMouseDown} style={{ padding: "11px 12px 10px", borderBottom: isMinimized ? "none" : "1px solid #e8edf5", background: "linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)", flexShrink: 0, cursor: "grab", userSelect: "none" }}>
//           <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isMinimized ? 0 : 10 }}>
//             <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
//               <div style={{ display: "flex", flexDirection: "column", gap: 3, marginRight: 2, opacity: 0.35 }}>
//                 {[0,1,2].map(i => (<div key={i} style={{ display: "flex", gap: 3 }}><div style={{ width: 3, height: 3, borderRadius: "50%", background: "#64748b" }} /><div style={{ width: 3, height: 3, borderRadius: "50%", background: "#64748b" }} /></div>))}
//               </div>
//               <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 10px #3b82f650", flexShrink: 0 }}>
//                 <AppstoreOutlined style={{ color: "#fff", fontSize: 17 }} />
//               </div>
//               <div>
//                 <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", lineHeight: 1.2 }}>ToolBox</div>
//                 <div style={{ fontSize: 10, color: "#64748b" }}>{rooms.length} rooms · {DEVICE_TYPES.length} device types</div>
//               </div>
//             </div>
//             <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
//               <Tooltip title={isMinimized ? "Expand" : "Minimize"}>
//                 <button onMouseDown={e => e.stopPropagation()} onClick={() => setIsMinimized(p => !p)}
//                   style={{ width: 26, height: 26, borderRadius: 7, background: "#f1f5f9", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b", fontSize: 11, transition: "all 0.15s" }}
//                   onMouseEnter={e => { e.currentTarget.style.background = "#e0f2fe"; e.currentTarget.style.color = "#0284c7"; }}
//                   onMouseLeave={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#64748b"; }}
//                 >{isMinimized ? "▲" : "▼"}</button>
//               </Tooltip>
//               <button onMouseDown={e => e.stopPropagation()} onClick={onClose}
//                 style={{ width: 26, height: 26, borderRadius: 7, background: "#f1f5f9", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b", transition: "all 0.15s", fontSize: 12 }}
//                 onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "#fca5a5"; }}
//                 onMouseLeave={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
//               ><CloseOutlined /></button>
//             </div>
//           </div>
//           {!isMinimized && (
//             <div style={{ position: "relative" }}>
//               <SearchOutlined style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 12, pointerEvents: "none" }} />
//               <input type="text" placeholder="Search devices…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onMouseDown={e => e.stopPropagation()}
//                 style={{ width: "100%", padding: "7px 10px 7px 29px", borderRadius: 8, border: "1px solid #dde5f0", fontSize: 12, outline: "none", background: "#fff", color: "#1e293b", boxSizing: "border-box", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }} />
//             </div>
//           )}
//         </div>

//         {/* Body */}
//         {!isMinimized && (
//           <div className="toolbox-panel-scroll" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "12px 12px 24px" }}>
//             <div style={{ marginBottom: 18 }}>
//               <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
//                 <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.8px" }}>Rooms</span>
//                 <button onClick={() => setShowAddModal(true)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 6, background: "#f0f9ff", border: "1px solid #bae6fd", color: "#0284c7", fontSize: 10, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
//                   onMouseEnter={e => { e.currentTarget.style.background = "#e0f2fe"; }} onMouseLeave={e => { e.currentTarget.style.background = "#f0f9ff"; }}>
//                   <PlusOutlined style={{ fontSize: 9 }} /> Add Room
//                 </button>
//               </div>
//               <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
//                 {rooms.map(room => {
//                   const c = room.hex || room.color;
//                   const iconCls = room.icon?.startsWith("fa-") ? room.icon : `fa-${room.icon}`;
//                   const isExp = expandedRoom === room.id;
//                   return (
//                     <div key={room.id} style={{ borderRadius: 10, border: `1.5px solid ${isExp ? c + "55" : "#e5eaf2"}`, background: isExp ? `${c}08` : "#fff", overflow: "hidden", transition: "all 0.18s", boxShadow: isExp ? `0 2px 10px ${c}18` : "none" }}>
//                       <div onClick={() => setExpandedRoom(isExp ? null : room.id)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", cursor: "pointer" }}
//                         onMouseEnter={e => { if (!isExp) e.currentTarget.style.background = `${c}08`; }}
//                         onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
//                       >
//                         <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: `${c}1a`, border: `1px solid ${c}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
//                           <i className={`fas ${iconCls}`} style={{ color: c, fontSize: 14, pointerEvents: "none" }} />
//                         </div>
//                         <div style={{ flex: 1, minWidth: 0 }}>
//                           <div style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{room.name}</div>
//                           <div style={{ fontSize: 9.5, color: "#94a3b8", marginTop: 1 }}>{room.width}m × {room.length}m × {room.height}m</div>
//                         </div>
//                         <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
//                           <Tooltip title="View in 3D Viewer">
//                             <div onClick={e => { e.stopPropagation(); onViewRoom(room.id); }} style={{ width: 27, height: 27, borderRadius: 7, background: "#f0fdf4", border: "1px solid #86efac", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}
//                               onMouseEnter={e => { e.currentTarget.style.background = "#dcfce7"; e.currentTarget.style.borderColor = "#4ade80"; }}
//                               onMouseLeave={e => { e.currentTarget.style.background = "#f0fdf4"; e.currentTarget.style.borderColor = "#86efac"; }}>
//                               <EyeFilled style={{ fontSize: 12, color: "#16a34a" }} />
//                             </div>
//                           </Tooltip>
//                           <Tooltip title="Delete room">
//                             <div onClick={e => handleDeleteClick(e, room)} style={{ width: 27, height: 27, borderRadius: 7, background: "#fff1f2", border: "1px solid #fca5a5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}
//                               onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.borderColor = "#f87171"; }}
//                               onMouseLeave={e => { e.currentTarget.style.background = "#fff1f2"; e.currentTarget.style.borderColor = "#fca5a5"; }}>
//                               <DeleteOutlined style={{ fontSize: 11, color: "#ef4444" }} />
//                             </div>
//                           </Tooltip>
//                           <CaretDownOutlined style={{ fontSize: 9, color: "#cbd5e1", transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
//                         </div>
//                       </div>
//                       {isExp && <RoomDevicePanel room={room} />}
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>

//             <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #dde5f0 40%, #dde5f0 60%, transparent)", margin: "4px 0 16px" }} />

//             <div>
//               <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>Device Library</div>
//               <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
//                 {categories.map(cat => (
//                   <button key={cat} onClick={() => setCategoryFilter(cat)}
//                     style={{ padding: "3px 9px", borderRadius: 12, border: "none", background: categoryFilter === cat ? (CATEGORY_COLORS[cat] || "#3b82f6") : "#f1f5f9", color: categoryFilter === cat ? "#fff" : "#64748b", fontSize: 9.5, fontWeight: 600, cursor: "pointer", transition: "all 0.14s", boxShadow: categoryFilter === cat ? `0 2px 6px ${CATEGORY_COLORS[cat] || "#3b82f6"}44` : "none" }}>
//                     {cat}
//                   </button>
//                 ))}
//               </div>
//               <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7 }}>
//                 {filteredDevices.map(dt => <DeviceTileLarge key={dt.name} dt={dt} />)}
//               </div>
//               {filteredDevices.length === 0 && <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8", fontSize: 12 }}>No devices match your search</div>}
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Add Room Modal */}
//       {showAddModal && (
//         <>
//           <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100001 }} onClick={closeAddModal} />
//           <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "white", padding: "24px", borderRadius: "8px", width: "400px", maxWidth: "95%", maxHeight: "90vh", overflowY: "auto", zIndex: 100002, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
//             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
//               <h2 style={{ margin: 0, fontSize: "18px", color: "#0284c7" }}><PlusOutlined style={{ marginRight: 8, fontSize: "16px" }} />Add New Room</h2>
//               <button onClick={closeAddModal} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "#666", padding: "4px" }}><CloseOutlined /></button>
//             </div>
//             <div style={{ marginBottom: 16 }}>
//               <label style={{ fontSize: 12, color: "#475569", marginBottom: 4, display: "block" }}>Room Name</label>
//               <Input value={newRoom.name} onChange={e => setNewRoom({ ...newRoom, name: e.target.value })} placeholder="e.g., Network Room" size="small" />
//             </div>
//             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 24 }}>
//               {[["Width (m)", "width"], ["Length (m)", "length"], ["Height (m)", "height"]].map(([lbl, key]) => (
//                 <div key={key}>
//                   <label style={{ fontSize: 12, color: "#475569", marginBottom: 4, display: "block" }}>{lbl}</label>
//                   <Input type="number" size="small" min={2} max={180} value={newRoom[key]} onChange={e => setNewRoom({ ...newRoom, [key]: parseInt(e.target.value) || 8 })} />
//                 </div>
//               ))}
//             </div>
//             <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
//               <button onClick={closeAddModal} style={{ padding: "6px 16px", border: "1px solid #d9d9d9", background: "white", borderRadius: "4px", cursor: "pointer", fontSize: "14px" }}>Cancel</button>
//               <button onClick={handleAddRoom} style={{ padding: "6px 16px", background: "#0284c7", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}>Add Room</button>
//             </div>
//           </div>
//         </>
//       )}

//       {/* Delete Confirmation Modal */}
//       {deleteConfirm.open && (
//         <>
//           <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100002 }} onClick={cancelDelete} />
//           <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "white", padding: "24px", borderRadius: "8px", width: "400px", maxWidth: "95%", maxHeight: "90vh", overflowY: "auto", zIndex: 100003, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", textAlign: "center" }}>
//             <div style={{ marginBottom: "16px" }}>
//               <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
//                 <DeleteOutlined style={{ fontSize: "28px", color: "#ef4444" }} />
//               </div>
//             </div>
//             <h2 style={{ color: "#ef4444", marginBottom: "8px", fontSize: "20px" }}>Delete Room</h2>
//             <p style={{ fontSize: "14px", marginBottom: "16px", color: "#374151" }}>Are you sure you want to delete <strong>"{deleteConfirm.roomName}"</strong>?</p>
//             <p style={{ margin: "0 0 20px 0", fontSize: "12px", color: "#94a3b8" }}>This will remove the room and all its placed devices from the 3D viewer. This action cannot be undone.</p>
//             <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
//               <button onClick={cancelDelete} style={{ padding: "8px 24px", border: "1px solid #d9d9d9", background: "white", borderRadius: "4px", cursor: "pointer", fontSize: "14px" }}>Cancel</button>
//               <button onClick={confirmDelete} style={{ padding: "8px 24px", background: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}>Yes, Delete</button>
//             </div>
//           </div>
//         </>
//       )}

//       <style>{`.toolbox-panel-scroll::-webkit-scrollbar{width:4px}.toolbox-panel-scroll::-webkit-scrollbar-thumb{background:#dde3ec;border-radius:4px}.toolbox-panel-scroll{scrollbar-width:thin;scrollbar-color:#dde3ec transparent}`}</style>
//     </>,
//     document.body
//   );
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // SECTION LABEL
// // ─────────────────────────────────────────────────────────────────────────────
// const SectionLabel = ({ label, collapsed }) => {
//   if (collapsed) {
//     return <div style={{ height: 1, background: "#e8edf5", margin: "6px 10px" }} />;
//   }
//   return (
//     <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px 4px", userSelect: "none" }}>
//       <span style={{ fontSize: 9.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.9px", whiteSpace: "nowrap" }}>{label}</span>
//       <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, #e2e8f0, transparent)" }} />
//     </div>
//   );
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // MAIN SIDEBAR
// // ─────────────────────────────────────────────────────────────────────────────
// const Sidebar = ({ collapsed, isMobile, visible, onZoomRoom }) => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { logout } = useAuth();

//   useFontAwesome();

//   const [toolboxOpen,   setToolboxOpen  ] = useState(false);
//   const [rooms,         setRooms        ] = useState(DEFAULT_ROOMS);
//   const [roomIdCounter, setRoomIdCounter] = useState(3);

//   const getSelectedKey = () => {
//     const p = location.pathname;
//     if (p === "/co2-reports")       return ["co2-reports"];
//     if (p === "/phosphine-reports") return ["phosphine-reports"];
//     return [p.substring(1) || "dashboard"];
//   };

//   const handleAddRoom = ({ name, width, length, height }) => {
//     const palettes = ["#9b59b6", "#e74c3c", "#1abc9c", "#f39c12", "#3498db", "#2ecc71"];
//     const color = palettes[roomIdCounter % palettes.length];
//     const newRoom = { id: roomIdCounter, name, color, hex: color, width, length, height, icon: "door-open", custom: true };
//     setRooms(prev => [...prev, newRoom]);
//     setRoomIdCounter(c => c + 1);
//     dcimBus.emit("addRoom", newRoom);
//   };

//   const handleDeleteRoom = (id) => {
//     setRooms(prev => prev.filter(r => r.id !== id));
//     dcimBus.emit("deleteRoom", { id });
//   };

//   const handleViewRoom = (id) => {
//     if (location.pathname !== "/dcim-viewer") navigate("/dcim-viewer");
//     dcimBus.emit("zoomRoom", { id });
//     if (onZoomRoom) onZoomRoom(id);
//   };

//   const accent = "#3b82f6";

//   const menuItems = [
//     // {
//     //   key: "alerts",
//     //   icon: <GlowIcon icon={AlertOutlined} glowColor={accent} isActive={location.pathname === "/alerts"} />,
//     //   label: <MenuLabel isCollapsed={collapsed}><Link to="/alerts">Alerts</Link></MenuLabel>,
//     // },
//     // {
//     //   key: "settings",
//     //   icon: <GlowIcon icon={SettingOutlined} glowColor={accent} isActive={location.pathname === "/settings"} />,
//     //   label: <MenuLabel isCollapsed={collapsed}><Link to="/settings">Settings</Link></MenuLabel>,
//     // },
//     { type: "divider", style: { margin: "6px 0", borderColor: "#e2e8f0" } },
//   ];

//   return (
//     <>
//       <ToolboxPanel
//         open={toolboxOpen} onClose={() => setToolboxOpen(false)}
//         collapsed={collapsed} rooms={rooms}
//         onAddRoom={handleAddRoom} onDeleteRoom={handleDeleteRoom} onViewRoom={handleViewRoom}
//       />

//       <Sider
//         trigger={null} collapsible collapsed={collapsed}
//         width={SIDEBAR_WIDTH} collapsedWidth={SIDEBAR_COLLAPSED}
//         style={{ position: "fixed", top: 0, bottom: 0, left: isMobile ? (visible ? 0 : "-100%") : 0, zIndex: 1000, height: "100vh", background: "#f8fafc", borderRight: "1px solid #e3e7ef", boxShadow: isMobile ? "0 0 15px rgba(0,0,0,0.1)" : "none", transition: "all 0.3s cubic-bezier(.4,0,.2,1)", display: "flex", flexDirection: "column", overflow: "hidden" }}
//         className="dcim-sidebar"
//       >
//         {/* Logo */}
//         <div onClick={() => { window.location.href = "/dcim-viewer"; }}
//           style={{ height: 56, flexShrink: 0, display: "flex", alignItems: "center", paddingLeft: collapsed ? 18 : 16, gap: 10, borderBottom: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer" }}>
//           <img src={Logo} alt="DCIM" style={{ height: 34, width: 34, borderRadius: 8, border: "2px solid #bfdbfe", flexShrink: 0 }} />
//           {!collapsed && <span style={{ color: "#3b82f6", fontWeight: 700, fontSize: 17, letterSpacing: ".4px" }}>DCIM Monitor</span>}
//         </div>

//         {/* Main Dashboard start */}
//         {/* 3D View trigger */}
//         <Tooltip title={collapsed ? "Dashboard" : ""} placement="right">
//           <div onClick={() => navigate("/display-dash-animate")}
//             style={{ flexShrink: 0, height: 48, display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 10, padding: collapsed ? 0 : "0 14px", cursor: "pointer", borderBottom: "1px solid #e2e8f0", background: location.pathname === "/display-dash-animate" ? "linear-gradient(90deg, #dbeafe 0%, #eff6ff 100%)" : "transparent", transition: "background 0.2s", userSelect: "none", position: "relative" }}
//             onMouseEnter={e => { if (location.pathname !== "display-dash-animate") e.currentTarget.style.background = "#f0f7ff"; }}
//             onMouseLeave={e => { if (location.pathname !== "display-dash-animate") e.currentTarget.style.background = "transparent"; }}
//           >
//             {location.pathname === "/display-dash-animate" && <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 24, borderRadius: "0 3px 3px 0", background: "#3b82f6" }} />}
//             <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: location.pathname === "/display-dash-animate" ? "linear-gradient(135deg, #3b82f6, #1d4ed8)" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: location.pathname === "/display-dash-animate" ? "0 2px 8px #3b82f650" : "none", transition: "all 0.2s" }}>
//               <DashboardOutlined style={{ fontSize: 15, color: location.pathname === "/display-dash-animate" ? "#fff" : "#64748b" }} />
//             </div>
//             {!collapsed && <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: location.pathname === "/display-dash-animate" ? "#2563eb" : "#1e293b" }}>Dashboard</span>}
//           </div>
//         </Tooltip>
//         {/* Main Dashboard end */}

//         {/* 3D View trigger */}
//         <Tooltip title={collapsed ? "3D View" : ""} placement="right">
//           <div onClick={() => navigate("/dcim-viewer")}
//             style={{ flexShrink: 0, height: 48, display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 10, padding: collapsed ? 0 : "0 14px", cursor: "pointer", borderBottom: "1px solid #e2e8f0", background: location.pathname === "/dcim-viewer" ? "linear-gradient(90deg, #dbeafe 0%, #eff6ff 100%)" : "transparent", transition: "background 0.2s", userSelect: "none", position: "relative" }}
//             onMouseEnter={e => { if (location.pathname !== "/dcim-viewer") e.currentTarget.style.background = "#f0f7ff"; }}
//             onMouseLeave={e => { if (location.pathname !== "/dcim-viewer") e.currentTarget.style.background = "transparent"; }}
//           >
//             {location.pathname === "/dcim-viewer" && <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 24, borderRadius: "0 3px 3px 0", background: "#3b82f6" }} />}
//             <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: location.pathname === "/dcim-viewer" ? "linear-gradient(135deg, #3b82f6, #1d4ed8)" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: location.pathname === "/dcim-viewer" ? "0 2px 8px #3b82f650" : "none", transition: "all 0.2s" }}>
//               <ApartmentOutlined style={{ fontSize: 15, color: location.pathname === "/dcim-viewer" ? "#fff" : "#64748b" }} />
//             </div>
//             {!collapsed && <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: location.pathname === "/dcim-viewer" ? "#2563eb" : "#1e293b" }}>3D View</span>}
//           </div>
//         </Tooltip>

//         {/* ToolBox trigger */}
//         <Tooltip title={collapsed ? "ToolBox" : ""} placement="right">
//           <div onClick={() => setToolboxOpen(p => !p)}
//             style={{ flexShrink: 0, height: 48, display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 10, padding: collapsed ? 0 : "0 14px", cursor: "pointer", borderBottom: "1px solid #e2e8f0", background: toolboxOpen ? "linear-gradient(90deg, #dbeafe 0%, #eff6ff 100%)" : "transparent", transition: "background 0.2s", userSelect: "none", position: "relative" }}
//             onMouseEnter={e => { if (!toolboxOpen) e.currentTarget.style.background = "#f0f7ff"; }}
//             onMouseLeave={e => { if (!toolboxOpen) e.currentTarget.style.background = "transparent"; }}
//           >
//             {toolboxOpen && <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 24, borderRadius: "0 3px 3px 0", background: "#3b82f6" }} />}
//             <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: toolboxOpen ? "linear-gradient(135deg, #3b82f6, #1d4ed8)" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: toolboxOpen ? "0 2px 8px #3b82f650" : "none", transition: "all 0.2s" }}>
//               <AppstoreOutlined style={{ fontSize: 15, color: toolboxOpen ? "#fff" : "#64748b" }} />
//             </div>
//             {!collapsed && (
//               <>
//                 <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: toolboxOpen ? "#2563eb" : "#1e293b" }}>ToolBox</span>
//                 <span style={{ background: toolboxOpen ? "#bfdbfe" : "#e0edff", color: "#3b82f6", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "1px 7px", transition: "background 0.2s" }}>{rooms.length}</span>
//                 <CaretDownOutlined style={{ fontSize: 10, color: "#94a3b8", marginLeft: 4, transform: "rotate(-90deg)", opacity: toolboxOpen ? 1 : 0.5, transition: "all 0.2s" }} />
//               </>
//             )}
//           </div>
//         </Tooltip>

//         {/* ── Nav scroll area ── */}
//         <div className="nav-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch", padding: "6px 0" }}>

//           {/* 1️⃣  Core Infrastructure (with nested Asset submenu) */}
//           <SubDropdown
//             label="Asset Management"
//             headerIcon={DatabaseOutlined}
//             subItems={CORE_INFRASTRUCTURE_SUB_ITEMS}
//             collapsed={collapsed}
//             pathname={location.pathname}
//           />

//           {/* ── Monitoring & Operations ── */}
//           <SectionLabel collapsed={collapsed} />
//           <SubDropdown
//             label="Monitoring & Operations"
//             headerIcon={HeatMapOutlined}
//             subItems={MONITORING_OPERATIONS_SUB_ITEMS}
//             collapsed={collapsed}
//             pathname={location.pathname}
//           />

//           {/* ── Planning & Optimization ── */}
//           <SectionLabel collapsed={collapsed} />
//           <SubDropdown
//             label="Planning & Optimization"
//             headerIcon={LineChartOutlined}
//             subItems={PLANNING_OPTIMIZATION_SUB_ITEMS}
//             collapsed={collapsed}
//             pathname={location.pathname}
//           />

//           {/* ── Intelligence & Analysis ── */}
//           <SectionLabel collapsed={collapsed} />
//           <SubDropdown
//             label="Intelligence & Analysis"
//             headerIcon={RobotOutlined}
//             subItems={INTELLIGENCE_ANALYSIS_SUB_ITEMS}
//             collapsed={collapsed}
//             pathname={location.pathname}
//           />

//           {/* ── Governance & Enterprise ── */}
//           <SectionLabel collapsed={collapsed} />
//           <SubDropdown
//             label="Governance & Enterprise"
//             headerIcon={AuditOutlined}
//             subItems={GOVERNANCE_ENTERPRISE_SUB_ITEMS}
//             collapsed={collapsed}
//             pathname={location.pathname}
//           />

//           {/* Divider */}
//           <div style={{ height: 1, background: "#e8edf5", margin: "4px 10px 2px" }} />

//           {/* 2️⃣  Alerts + Settings */}
//           <Menu
//             mode="inline"
//             inlineCollapsed={collapsed}
//             selectedKeys={getSelectedKey()}
//             style={{ background: "transparent", borderRight: "none", fontSize: 15, padding: "0" }}
//             items={menuItems}
//           />

//           {/* 3️⃣  Billing/Packages */}
//           <SubDropdown
//             label="Master"
//             headerIcon={AppstoreOutlined}
//             subItems={PACKAGES_SUB_ITEMS_MASTER}
//             collapsed={collapsed}
//             pathname={location.pathname}
//           />

//           <SubDropdown
//             label="Billing"
//             headerIcon={AppstoreOutlined}
//             subItems={PACKAGES_SUB_ITEMS}
//             collapsed={collapsed}
//             pathname={location.pathname}
//           />

//         </div>
//       </Sider>

//       <style>{`
//         .nav-scroll::-webkit-scrollbar { width: 3px; }
//         .nav-scroll::-webkit-scrollbar-thumb { background: #dde3ec; border-radius: 4px; }
//         .nav-scroll { scrollbar-width: thin; scrollbar-color: #dde3ec transparent; }
//         .dcim-sidebar .ant-menu { background: transparent; }
//         .dcim-sidebar .ant-menu-item,
//         .dcim-sidebar .ant-menu-submenu-title {
//           padding-left: 14px !important; padding-right: 8px !important;
//           display: flex; align-items: center; font-size: 15px; color: #1e293b;
//           min-height: 42px; border-radius: 8px; margin: 2px 4px;
//         }
//         .dcim-sidebar .ant-menu-item-selected {
//           background: linear-gradient(90deg, #dbeafe 40%, #f1f5fa 100%) !important;
//           border-left: 3px solid #3b82f6; color: #3b82f6 !important;
//         }
//         .dcim-sidebar .ant-menu-item:hover,
//         .dcim-sidebar .ant-menu-submenu-title:hover { background: #f1f5fa !important; color: #3b82f6 !important; }
//         .dcim-sidebar .ant-menu-sub { background: #f4f6fa !important; border-radius: 6px; overflow: visible !important; }
//         .dcim-sidebar .ant-menu-sub .ant-menu-item { padding-left: 14px !important; height: auto !important; white-space: normal !important; }
//         .dcim-sidebar .ant-menu-submenu-arrow { color: #94a3b8 !important; }
//         .dcim-sidebar .ant-menu-submenu-selected > .ant-menu-submenu-title { color: #3b82f6 !important; }

//         .dcim-sidebar {
//           display: flex !important;
//           flex-direction: column !important;
//           overflow: hidden !important;
//         }

//         .dcim-sidebar > .ant-layout-sider-children {
//           display: flex !important;
//           flex-direction: column !important;
//           overflow: hidden !important;
//           height: 100% !important;
//           min-height: 0 !important;
//         }
//       `}</style>
//     </>
//   );
// };

// Sidebar.defaultProps = { collapsed: false, isMobile: false, visible: true };
// export default Sidebar;




//---------------------------------testing wall ac unit room start--------------------------------


import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Layout, Menu, Input, Tooltip } from "antd";
import { useAuth } from "../Authentication/AuthContext";
import {
  DashboardOutlined,
  SettingOutlined,
  AlertOutlined,
  PlusCircleFilled,
  CaretDownOutlined,
  BankOutlined,
  AimOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeFilled,
  ApartmentOutlined,
  NodeIndexOutlined,
  AppstoreOutlined,
  CloseOutlined,
  SearchOutlined,
  DragOutlined,
  CreditCardOutlined,
  EnvironmentOutlined,
  SafetyCertificateOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
  CloudOutlined,
  WifiOutlined,
  BellOutlined,
  LineChartOutlined,
  BulbOutlined,
  SwapOutlined,
  RobotOutlined,
  BuildOutlined,
  TeamOutlined,
  AuditOutlined,
  ApiOutlined,
  HeatMapOutlined,
  ControlOutlined,
  InboxOutlined,
  TagsOutlined,
  ClusterOutlined,
  ShopOutlined,
  HistoryOutlined,
  FileTextOutlined,
  RightOutlined,

  GlobalOutlined,
  HomeOutlined,
  UserOutlined,
  CloudServerOutlined,
  BorderOutlined,
  CustomerServiceOutlined
} from "@ant-design/icons";
import Logo from "../assets/3879707.png";

const { Sider } = Layout;

const SIDEBAR_WIDTH     = 270;
const SIDEBAR_COLLAPSED = 72;
const TOOLBOX_WIDTH     = 310;
const ICON_SIZE         = 20;

const DEFAULT_ROOMS = [
  { id: 0, name: "Server Room",  icon: "server",    color: "#3498db", width: 20, length: 20, height: 8 },
  { id: 1, name: "AC Unit Room", icon: "snowflake", color: "#2ecc71", width: 20, length: 20, height: 8 },
  { id: 2, name: "DG Set Room",  icon: "bolt",      color: "#e67e22", width: 20, length: 20, height: 8 },
];

const DEVICE_TYPES = [
  { name: "Server Rack",    icon: "fa-server",           color: "#3498db", category: "Compute",     power: "1-5kW"    },
  { name: "Blade Server",   icon: "fa-sitemap",          color: "#2980b9", category: "Compute",     power: "0.5-2kW"  },
  { name: "AC Unit",        icon: "fa-snowflake",        color: "#2ecc71", category: "Cooling",     power: "5-20kW"   },
  { name: "Wall AC",        icon: "fa-wind",             color: "#00b4d8", category: "Cooling",     power: "1-5kW"    },
  { name: "Chiller",        icon: "fa-fan",              color: "#16a085", category: "Cooling",     power: "10-100kW" },
  { name: "CRAC Unit",      icon: "fa-temperature-low",  color: "#1abc9c", category: "Cooling",     power: "5-30kW"   },
  { name: "DG Set",         icon: "fa-bolt",             color: "#e67e22", category: "Power",       power: "50-500kW" },
  { name: "UPS",            icon: "fa-car-battery",      color: "#f39c12", category: "Power",       power: "1-100kVA" },
  { name: "PDU",            icon: "fa-plug",             color: "#1abc9c", category: "Power",       power: "10-100A"  },
  { name: "Network Switch", icon: "fa-network-wired",    color: "#9b59b6", category: "Network",     power: "100-500W" },
  { name: "Router",         icon: "fa-route",            color: "#e74c3c", category: "Network",     power: "50-300W"  },
  { name: "Firewall",       icon: "fa-shield-alt",       color: "#c0392b", category: "Security",    power: "100-400W" },
  { name: "Storage Array",  icon: "fa-hdd",              color: "#34495e", category: "Storage",     power: "1-10kW"   },
  { name: "CCTV Camera",    icon: "fa-video",            color: "#8e44ad", category: "Security",    power: "20-50W"   },
  { name: "FM200 System",   icon: "fa-fire",             color: "#f39c12", category: "Safety",      power: "200-500W" },
  { name: "Humidifier",     icon: "fa-tint",             color: "#3498db", category: "Environment", power: "0.5-5kW"  },
];

const CATEGORY_COLORS = {
  Compute: "#3498db", Cooling: "#2ecc71", Power: "#f39c12",
  Network: "#9b59b6", Security: "#e74c3c", Storage: "#34495e",
  Safety: "#e67e22",  Environment: "#1abc9c",
};

const dcimBus = {
  emit(event, data) {
    window.dispatchEvent(new CustomEvent(`dcim:${event}`, { detail: data }));
  },
};

let globalDragActive = false;

const useFontAwesome = () => {
  useEffect(() => {
    if (!document.getElementById("fa-cdn")) {
      const link = document.createElement("link");
      link.id   = "fa-cdn";
      link.rel  = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
      document.head.appendChild(link);
    }
  }, []);
};

function buildDragHandlers(payload, elRef) {
  return {
    onDragStart(e) {
      globalDragActive = true;
      const json = JSON.stringify(payload);
      e.dataTransfer.setData("text/plain", json);
      e.dataTransfer.effectAllowed = "copy";
      window.dispatchEvent(new CustomEvent("dcim:dragStart", { detail: payload }));
      if (elRef?.current) elRef.current.style.opacity = "0.5";
    },
    onDragEnd(e) {
      globalDragActive = false;
      window.dispatchEvent(new CustomEvent("dcim:dragEnd"));
      if (elRef?.current) {
        elRef.current.style.opacity = "1";
        elRef.current.style.transform = "scale(1)";
      }
    },
  };
}

const DeviceTileLarge = ({ dt }) => {
  const ref = useRef(null);
  const { onDragStart, onDragEnd } = buildDragHandlers({ ...dt, targetRoomId: null }, ref);
  return (
    <Tooltip title={`${dt.name} · ${dt.power}`} placement="top" mouseEnterDelay={0.2}>
      <div ref={ref} draggable onDragStart={onDragStart} onDragEnd={onDragEnd}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "10px 4px 8px", borderRadius: 10, background: `${dt.color}0e`, border: `1.5px solid ${dt.color}22`, cursor: "grab", transition: "all 0.15s ease", userSelect: "none" }}
        onMouseEnter={e => { e.currentTarget.style.background = `${dt.color}20`; e.currentTarget.style.border = `1.5px solid ${dt.color}60`; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 16px ${dt.color}28`; }}
        onMouseLeave={e => { e.currentTarget.style.background = `${dt.color}0e`; e.currentTarget.style.border = `1.5px solid ${dt.color}22`; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
      >
        <div style={{ width: 42, height: 42, borderRadius: 11, background: `${dt.color}18`, border: `1px solid ${dt.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <i className={`fas ${dt.icon}`} style={{ color: dt.color, fontSize: 19, pointerEvents: "none" }} />
        </div>
        <span style={{ fontSize: 9.5, fontWeight: 600, color: "#374151", textAlign: "center", lineHeight: 1.3, maxWidth: 62, wordBreak: "break-word" }}>{dt.name}</span>
      </div>
    </Tooltip>
  );
};

const DeviceTileSmall = ({ dt, roomId }) => {
  const ref = useRef(null);
  const { onDragStart, onDragEnd } = buildDragHandlers({ ...dt, targetRoomId: roomId }, ref);
  return (
    <Tooltip title={`${dt.name} · ${dt.power}`} placement="top" mouseEnterDelay={0.2}>
      <div ref={ref} draggable onDragStart={onDragStart} onDragEnd={onDragEnd}
        style={{ width: 36, height: 36, borderRadius: 8, background: `${dt.color}12`, border: `1.5px solid ${dt.color}28`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "grab", transition: "all 0.13s ease", flexShrink: 0 }}
        onMouseEnter={e => { e.currentTarget.style.background = `${dt.color}26`; e.currentTarget.style.border = `1.5px solid ${dt.color}70`; e.currentTarget.style.transform = "scale(1.1)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = `${dt.color}12`; e.currentTarget.style.border = `1.5px solid ${dt.color}28`; e.currentTarget.style.transform = "scale(1)"; }}
      >
        <i className={`fas ${dt.icon}`} style={{ color: dt.color, fontSize: 14, pointerEvents: "none" }} />
      </div>
    </Tooltip>
  );
};

const RoomDevicePanel = ({ room }) => {
  const [roomSearch, setRoomSearch] = useState("");
  const c = room.hex || room.color;
  const filtered = DEVICE_TYPES.filter(d =>
    d.name.toLowerCase().includes(roomSearch.toLowerCase()) ||
    d.category.toLowerCase().includes(roomSearch.toLowerCase())
  );
  return (
    <div style={{ padding: "4px 10px 12px", borderTop: `1px solid ${c}20` }}>
      <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.6px", margin: "7px 0 8px" }}>Drag a device into the 3D viewer ↓</div>
      <div style={{ position: "relative", marginBottom: 8 }}>
        <SearchOutlined style={{ position: "absolute", left: 7, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 11, pointerEvents: "none" }} />
        <input type="text" placeholder="Filter devices…" value={roomSearch} onChange={e => setRoomSearch(e.target.value)} onClick={e => e.stopPropagation()}
          style={{ width: "100%", padding: "5px 26px 5px 24px", borderRadius: 7, border: `1px solid ${c}30`, fontSize: 11, outline: "none", background: `${c}08`, color: "#1e293b", boxSizing: "border-box" }} />
        {roomSearch && <button onClick={e => { e.stopPropagation(); setRoomSearch(""); }} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 10, padding: 0, lineHeight: 1 }}>✕</button>}
      </div>
      {filtered.length > 0
        ? <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>{filtered.map(dt => <DeviceTileSmall key={dt.name} dt={dt} roomId={room.id} />)}</div>
        : <div style={{ textAlign: "center", padding: "10px 0", color: "#94a3b8", fontSize: 11 }}>No devices match "{roomSearch}"</div>}
    </div>
  );
};

const GlowIcon = ({ icon: Icon, glowColor = "#2563eb", isActive = false }) => (
  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
    {isActive && <div style={{ position: "absolute", inset: -1, borderRadius: "50%", background: `radial-gradient(circle, ${glowColor}26 0%, transparent 80%)`, filter: "blur(2px)", zIndex: 0 }} />}
    <Icon style={{ fontSize: ICON_SIZE, color: isActive ? glowColor : "#64748b", zIndex: 1 }} />
  </div>
);

const MenuLabel = ({ children, isCollapsed }) =>
  isCollapsed ? null : (
    <span style={{ color: "#1e293b", marginLeft: 13, fontSize: 15, fontWeight: 500, whiteSpace: "nowrap" }}>{children}</span>
  );

// ─────────────────────────────────────────────────────────────────────────────
// ASSET SUBMENU ITEMS (nested under Core Infrastructure → Asset)
// ─────────────────────────────────────────────────────────────────────────────
const ASSET_SUB_ITEMS = [
  { key: "asset-dashboard",  icon: DashboardOutlined,   label: "Dashboard",          to: "/asset-dashboard"      },
  { key: "add-device",       icon: InboxOutlined,   label: "Onboarding",          to: "/add-device"       },
  { key: "add-device-type",  icon: TagsOutlined,    label: "Type",                to: "/add-device-type"  },
  { key: "device-category",  icon: ApartmentOutlined, label: "Category",          to: "/device-category"  },
  { key: "add-company",      icon: ShopOutlined,    label: "Manufacturer",        to: "/add-manufacturer" },
  // { key: "life-cycle",       icon: HistoryOutlined, label: "Life Cycle (Stages)", to: "/life-cycle"       },
  { key: "modal-specs",      icon: FileTextOutlined,label: "Model Specifications", to: "/modal-specs"      },
];

const AREA_SUB_ITEMS = [
  { key: "country", icon: GlobalOutlined,   label: "Country", to: "/add-country" },
  { key: "state",  icon: EnvironmentOutlined, label: "State", to: "/add-state"  },
  { key: "city",  icon: BankOutlined, label: "City", to: "/add-city"  },
  // { key: "location",  icon: HomeOutlined, label: "Location", to: "/add-location"  },
  { key: "site",  icon: BankOutlined, label: "Site", to: "/add-site"  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CORE INFRASTRUCTURE SUB-ITEMS (with Asset as a nested group)
// ─────────────────────────────────────────────────────────────────────────────
const CORE_INFRASTRUCTURE_SUB_ITEMS = [
  { key: "asset-group",      icon: DatabaseOutlined,    label: "Asset",              isGroup: true, children: ASSET_SUB_ITEMS },
  { key: "rack",             icon: ControlOutlined,     label: "Rack",               to: "/rack"              },
  { key: "power",            icon: ThunderboltOutlined, label: "Power",              to: "/power"             },
  { key: "cooling-thermal",  icon: CloudOutlined,       label: "Cooling and Thermal", to: "/cooling-thermal"  },
];

const MONITORING_OPERATIONS_SUB_ITEMS = [
  { key: "environment",      icon: EnvironmentOutlined, label: "Environment",        to: "/environment"       },
  { key: "network-it",       icon: WifiOutlined,        label: "Network and IT",     to: "/network-it"        },
  { key: "alarms-event",     icon: BellOutlined,        label: "Alarms & Event",     to: "/alarms-event"      },
];

const PLANNING_OPTIMIZATION_SUB_ITEMS = [
  { key: "capacity-planning",  icon: LineChartOutlined, label: "Capacity Planning",  to: "/capacity-planning" },
  { key: "energy-efficiency",  icon: BulbOutlined,      label: "Energy Efficiency",  to: "/energy-efficiency" },
  { key: "change-management",  icon: SwapOutlined,      label: "Change Management",  to: "/change-management" },
];

const INTELLIGENCE_ANALYSIS_SUB_ITEMS = [
  { key: "ai-predictive",    icon: RobotOutlined,       label: "AI & Predictive Maintenance", to: "/ai-predictive"   },
  { key: "digital-twin",     icon: BuildOutlined,       label: "Digital Twin modules",        to: "/digital-twin"    },
];

const GOVERNANCE_ENTERPRISE_SUB_ITEMS = [
  { key: "multi-tenant",     icon: TeamOutlined,        label: "Multi-Tenant & Access Control", to: "/multi-tenant"  },
  { key: "compliance",       icon: AuditOutlined,       label: "Compliance & Reporting",        to: "/compliance"    },
  { key: "integration-api",  icon: ApiOutlined,         label: "Integration & API",             to: "/integration-api"},
];

const PACKAGES_SUB_ITEMS = [
  { key: "packages", icon: AppstoreOutlined,   label: "Package", to: "/packages" },
  { key: "billing",  icon: CreditCardOutlined, label: "Billing", to: "/billing"  },
];
const PACKAGES_SUB_ITEMS_MASTER = [
  { key: "area", icon: BorderOutlined,   label: "Area", isGroup: true, children: AREA_SUB_ITEMS },
  { key: "tenant",  icon: TeamOutlined, label: "Tenant", to: "/add-tenant"  },
  { key: "user",  icon: UserOutlined, label: "User", to: "/add-user"  },
  { key: "role",  icon: UserOutlined, label: "Role", to: "/add-role"  },
  { key: "dataCenter",  icon: CloudServerOutlined, label: "DataCenter", to: "/add-datacenter"  },
  { key: "service",  icon: CustomerServiceOutlined, label: "Service", to: "/add-service"  },
  // { key: "room",  icon: ApartmentOutlined, label: "Room", to: "/add-room"  },
];

// ─────────────────────────────────────────────────────────────────────────────
// NESTED GROUP ITEM — renders a collapsible sub-group inside a SubDropdown
// ─────────────────────────────────────────────────────────────────────────────
const NestedGroupItem = ({ item, pathname, accent }) => {
  const isAnyChildActive = item.children.some(c => pathname === c.to);
  const [open, setOpen] = useState(isAnyChildActive);

  useEffect(() => { if (isAnyChildActive) setOpen(true); }, [pathname]);

  return (
    <div style={{ margin: "1px 0" }}>
      {/* Group header row */}
      <div
        onClick={() => setOpen(p => !p)}
        style={{
          position: "relative", display: "flex", alignItems: "center", gap: 8,
          padding: "0 10px 0 42px", height: 40, margin: "1px 0 1px 4px",
          borderRadius: 8,
          borderLeft: isAnyChildActive && !open ? `3px solid ${accent}` : "3px solid transparent",
          background: isAnyChildActive && !open ? "linear-gradient(90deg, #dbeafe 40%, #f1f5fa 100%)" : "transparent",
          transition: "all 0.15s", cursor: "pointer", userSelect: "none",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "#f1f5fa"; }}
        onMouseLeave={e => { e.currentTarget.style.background = isAnyChildActive && !open ? "linear-gradient(90deg, #dbeafe 40%, #f1f5fa 100%)" : "transparent"; }}
      >
        {/* dot + connector */}
        <div style={{ position: "absolute", left: 22, top: "50%", width: 6, height: 6, borderRadius: "50%", background: isAnyChildActive ? accent : "#e2e8f0", border: `1.5px solid ${isAnyChildActive ? accent : "#cbd5e1"}`, transform: "translate(-50%, -50%)", zIndex: 1, transition: "all 0.15s" }} />
        <div style={{ position: "absolute", left: 28, top: "50%", width: 10, height: 1.5, borderRadius: 2, background: isAnyChildActive ? `${accent}80` : "#e2e8f0", transform: "translateY(-50%)", transition: "background 0.15s" }} />
        <item.icon style={{ fontSize: 13, color: isAnyChildActive ? accent : "#64748b", flexShrink: 0, transition: "color 0.15s" }} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: isAnyChildActive ? 600 : 400, color: isAnyChildActive ? accent : "#000000", whiteSpace: "nowrap", transition: "all 0.15s" }}>{item.label}</span>
        <CaretDownOutlined style={{ fontSize: 9, color: "#94a3b8", transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.22s cubic-bezier(.4,0,.2,1)", marginRight: 4 }} />
      </div>

      {/* Children */}
      <div style={{ overflow: "hidden", maxHeight: open ? `${item.children.length * 38}px` : "0px", transition: "max-height 0.25s cubic-bezier(.4,0,.2,1)", opacity: open ? 1 : 0, transitionProperty: "max-height, opacity" }}>
        <div style={{ position: "relative", paddingTop: 2, paddingBottom: 2 }}>
          {/* deep connector line */}
          <div style={{ position: "absolute", left: 38, top: 6, bottom: 6, width: 1.5, borderRadius: 2, background: "linear-gradient(to bottom, #cbd5e1 0%, #e2e8f0 100%)" }} />
          {item.children.map(child => {
            const isActive = pathname === child.to;
            const Icon = child.icon;
            return (
              <Link key={child.key} to={child.to} style={{ textDecoration: "none", display: "block" }}>
                <div
                  style={{
                    position: "relative", display: "flex", alignItems: "center", gap: 8,
                    padding: "0 10px 0 58px", height: 36, margin: "1px 0 1px 4px",
                    borderRadius: 8,
                    borderLeft: isActive ? `3px solid ${accent}` : "3px solid transparent",
                    background: isActive ? "linear-gradient(90deg, #dbeafe 40%, #f1f5fa 100%)" : "transparent",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f1f5fa"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ position: "absolute", left: 34, top: "50%", width: 6, height: 6, borderRadius: "50%", background: isActive ? accent : "#e2e8f0", border: `1.5px solid ${isActive ? accent : "#cbd5e1"}`, transform: "translate(-50%, -50%)", zIndex: 1, transition: "all 0.15s" }} />
                  <div style={{ position: "absolute", left: 40, top: "50%", width: 10, height: 1.5, borderRadius: 2, background: isActive ? `${accent}80` : "#e2e8f0", transform: "translateY(-50%)", transition: "background 0.15s" }} />
                  <Icon style={{ fontSize: 12, color: isActive ? accent : "#94a3b8", flexShrink: 0, transition: "color 0.15s" }} />
                  <span style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, color: isActive ? accent : "#000000", whiteSpace: "nowrap", transition: "all 0.15s" }}>{child.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE SUB-DROPDOWN — supports flat items AND nested group items
// ─────────────────────────────────────────────────────────────────────────────
const SubDropdown = ({ label, headerIcon: HeaderIcon, subItems, collapsed, pathname }) => {
  const accent = "#3b82f6";

  // Check active across flat items and group children
  const isAnyActive = subItems.some(i => {
    if (i.isGroup) return i.children.some(c => pathname === c.to);
    return pathname === i.to;
  });

  const [open, setOpen] = useState(isAnyActive);
  useEffect(() => { if (isAnyActive) setOpen(true); }, [pathname]);

  // Calculate max-height for animation: groups count their children too
  const itemCount = subItems.reduce((acc, i) => {
    if (i.isGroup) return acc + 1 + i.children.length;
    return acc + 1;
  }, 0);

  if (collapsed) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "2px 0" }}>
        <Tooltip title={label} placement="right">
          <div onClick={() => setOpen(p => !p)}
            style={{ width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: isAnyActive ? `${accent}18` : "transparent", transition: "all 0.15s", marginBottom: 2 }}
            onMouseEnter={e => { e.currentTarget.style.background = "#f0f7ff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = isAnyActive ? `${accent}18` : "transparent"; }}
          >
            <HeaderIcon style={{ fontSize: 18, color: isAnyActive ? accent : "#64748b" }} />
          </div>
        </Tooltip>
        {subItems.map(item => {
          if (item.isGroup) {
            return item.children.map(child => {
              const isActive = pathname === child.to;
              const Icon = child.icon;
              return (
                <Tooltip key={child.key} title={child.label} placement="right">
                  <Link to={child.to}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, margin: "1px auto", display: "flex", alignItems: "center", justifyContent: "center", background: isActive ? `${accent}18` : "transparent", transition: "all 0.15s" }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f0f7ff"; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                    >
                      <Icon style={{ fontSize: 13, color: isActive ? accent : "#64748b" }} />
                    </div>
                  </Link>
                </Tooltip>
              );
            });
          }
          const isActive = pathname === item.to;
          const Icon = item.icon;
          return (
            <Tooltip key={item.key} title={item.label} placement="right">
              <Link to={item.to}>
                <div style={{ width: 36, height: 36, borderRadius: 8, margin: "1px auto", display: "flex", alignItems: "center", justifyContent: "center", background: isActive ? `${accent}18` : "transparent", transition: "all 0.15s" }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f0f7ff"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <Icon style={{ fontSize: 13, color: isActive ? accent : "#64748b" }} />
                </div>
              </Link>
            </Tooltip>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ margin: "2px 4px" }}>
      {/* Section header */}
      <div onClick={() => setOpen(p => !p)}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 0 14px", height: 42, borderRadius: 8, cursor: "pointer", userSelect: "none", transition: "all 0.15s", background: isAnyActive && !open ? "linear-gradient(90deg, #dbeafe 40%, #f1f5fa 100%)" : "transparent", borderLeft: isAnyActive && !open ? `3px solid ${accent}` : "3px solid transparent" }}
        onMouseEnter={e => { e.currentTarget.style.background = "#f1f5fa"; }}
        onMouseLeave={e => { e.currentTarget.style.background = isAnyActive && !open ? "linear-gradient(90deg, #dbeafe 40%, #f1f5fa 100%)" : "transparent"; }}
      >
        <GlowIcon icon={HeaderIcon} glowColor={accent} isActive={isAnyActive} />
        <span style={{ flex: 1, fontSize: 15, fontWeight: 500, color: isAnyActive ? accent : "#1e293b", whiteSpace: "nowrap" }}>{label}</span>
        <CaretDownOutlined style={{ fontSize: 10, color: "#94a3b8", transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.22s cubic-bezier(.4,0,.2,1)" }} />
      </div>

      {/* Animated body */}
      <div style={{ overflow: "hidden", maxHeight: open ? `${itemCount * 46 + 20}px` : "0px", transition: "max-height 0.3s cubic-bezier(.4,0,.2,1)", opacity: open ? 1 : 0, transitionProperty: "max-height, opacity" }}>
        <div style={{ position: "relative", paddingTop: 2, paddingBottom: 4 }}>
          {/* vertical connector line */}
          <div style={{ position: "absolute", left: 26, top: 10, bottom: 10, width: 1.5, borderRadius: 2, background: "linear-gradient(to bottom, #cbd5e1 0%, #e2e8f0 100%)" }} />

          {subItems.map(item => {
            if (item.isGroup) {
              return <NestedGroupItem key={item.key} item={item} pathname={pathname} accent={accent} />;
            }

            const isActive = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link key={item.key} to={item.to} style={{ textDecoration: "none", display: "block" }}>
                <div
                  style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, padding: "0 10px 0 42px", height: 40, margin: "1px 0 1px 4px", borderRadius: 8, borderLeft: isActive ? `3px solid ${accent}` : "3px solid transparent", background: isActive ? "linear-gradient(90deg, #dbeafe 40%, #f1f5fa 100%)" : "transparent", transition: "all 0.15s" }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#f1f5fa"; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ position: "absolute", left: 22, top: "50%", width: 6, height: 6, borderRadius: "50%", background: isActive ? accent : "#e2e8f0", border: `1.5px solid ${isActive ? accent : "#cbd5e1"}`, transform: "translate(-50%, -50%)", zIndex: 1, transition: "all 0.15s" }} />
                  <div style={{ position: "absolute", left: 28, top: "50%", width: 10, height: 1.5, borderRadius: 2, background: isActive ? `${accent}80` : "#e2e8f0", transform: "translateY(-50%)", transition: "background 0.15s" }} />
                  <Icon style={{ fontSize: 13, color: isActive ? accent : "#64748b", flexShrink: 0, transition: "color 0.15s" }} />
                  <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? accent : "#000000", whiteSpace: "nowrap", transition: "all 0.15s" }}>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DRAGGABLE FLOATING TOOLBOX PANEL
// ─────────────────────────────────────────────────────────────────────────────
const ToolboxPanel = ({ open, onClose, collapsed, rooms, onAddRoom, onDeleteRoom, onViewRoom }) => {
  const [searchTerm,     setSearchTerm    ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [expandedRoom,   setExpandedRoom  ] = useState(null);
  const [showAddModal,   setShowAddModal  ] = useState(false);
  const [newRoom,        setNewRoom       ] = useState({ name: "", width: 20, length: 20, height: 8 });
  const [isDragging,     setIsDragging    ] = useState(false);
  const [deleteConfirm,  setDeleteConfirm ] = useState({ open: false, roomId: null, roomName: "" });

  const sidebarEdge = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH;
  const [panelPos, setPanelPos] = useState({ x: sidebarEdge + 12, y: 60 });
  const [isMinimized, setIsMinimized] = useState(false);

  const draggingPanel = useRef(false);
  const dragOffset    = useRef({ x: 0, y: 0 });
  const panelRef      = useRef(null);

  useEffect(() => { setPanelPos(prev => ({ ...prev, x: sidebarEdge + 12 })); }, [sidebarEdge]);

  useEffect(() => {
    const onStart = () => setIsDragging(true);
    const onEnd   = () => setIsDragging(false);
    window.addEventListener("dcim:dragStart", onStart);
    window.addEventListener("dcim:dragEnd",   onEnd);
    return () => { window.removeEventListener("dcim:dragStart", onStart); window.removeEventListener("dcim:dragEnd", onEnd); };
  }, []);

  const onHeaderMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    if (e.target.closest("button") || e.target.closest("input")) return;
    draggingPanel.current = true;
    dragOffset.current = { x: e.clientX - panelPos.x, y: e.clientY - panelPos.y };
    e.preventDefault();
  }, [panelPos]);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!draggingPanel.current) return;
      const newX = Math.max(0, Math.min(window.innerWidth - TOOLBOX_WIDTH, e.clientX - dragOffset.current.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffset.current.y));
      setPanelPos({ x: newX, y: newY });
    };
    const onMouseUp = () => { draggingPanel.current = false; };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseup", onMouseUp); };
  }, []);

  const categories = ["All", ...Object.keys(CATEGORY_COLORS)];
  const filteredDevices = DEVICE_TYPES.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || d.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryFilter === "All" || d.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const handleAddRoom = () => {
    if (!newRoom.name.trim()) { alert("Please enter a room name"); return; }
    onAddRoom(newRoom);
    setNewRoom({ name: "", width: 20, length: 20, height: 8 });
    setShowAddModal(false);
  };

  const handleDeleteClick = (e, room) => { e.stopPropagation(); setDeleteConfirm({ open: true, roomId: room.id, roomName: room.name }); };
  const confirmDelete = () => { onDeleteRoom(deleteConfirm.roomId); setExpandedRoom(prev => prev === deleteConfirm.roomId ? null : prev); setDeleteConfirm({ open: false, roomId: null, roomName: "" }); };
  const cancelDelete  = () => setDeleteConfirm({ open: false, roomId: null, roomName: "" });
  const closeAddModal = () => { setShowAddModal(false); setNewRoom({ name: "", width: 20, length: 20, height: 8 }); };

  if (!open) return null;

  return ReactDOM.createPortal(
    <>
      {!showAddModal && !deleteConfirm.open && (
        <div onClick={isDragging ? undefined : onClose} style={{ position: "fixed", inset: 0, zIndex: 99998, pointerEvents: isDragging ? "none" : "all", background: "transparent" }} />
      )}

      <div ref={panelRef} style={{ position: "fixed", left: panelPos.x, top: panelPos.y, width: TOOLBOX_WIDTH, maxHeight: isMinimized ? 54 : "calc(100vh - 80px)", zIndex: 99999, display: "flex", flexDirection: "column", background: "linear-gradient(170deg, #ffffff 0%, #f7f9ff 100%)", border: "1px solid #e0e7f0", borderRadius: 14, boxShadow: "0 8px 40px rgba(59,130,246,0.15), 0 2px 12px rgba(0,0,0,0.10), 0 0 0 1px rgba(59,130,246,0.06)", overflow: "hidden", transition: "max-height 0.28s cubic-bezier(.4,0,.2,1), box-shadow 0.2s ease", pointerEvents: "all" }}>

        {/* Header */}
        <div onMouseDown={onHeaderMouseDown} style={{ padding: "11px 12px 10px", borderBottom: isMinimized ? "none" : "1px solid #e8edf5", background: "linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)", flexShrink: 0, cursor: "grab", userSelect: "none" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isMinimized ? 0 : 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, marginRight: 2, opacity: 0.35 }}>
                {[0,1,2].map(i => (<div key={i} style={{ display: "flex", gap: 3 }}><div style={{ width: 3, height: 3, borderRadius: "50%", background: "#64748b" }} /><div style={{ width: 3, height: 3, borderRadius: "50%", background: "#64748b" }} /></div>))}
              </div>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 10px #3b82f650", flexShrink: 0 }}>
                <AppstoreOutlined style={{ color: "#fff", fontSize: 17 }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", lineHeight: 1.2 }}>ToolBox</div>
                <div style={{ fontSize: 10, color: "#64748b" }}>{rooms.length} rooms · {DEVICE_TYPES.length} device types</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              <Tooltip title={isMinimized ? "Expand" : "Minimize"}>
                <button onMouseDown={e => e.stopPropagation()} onClick={() => setIsMinimized(p => !p)}
                  style={{ width: 26, height: 26, borderRadius: 7, background: "#f1f5f9", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b", fontSize: 11, transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#e0f2fe"; e.currentTarget.style.color = "#0284c7"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#64748b"; }}
                >{isMinimized ? "▲" : "▼"}</button>
              </Tooltip>
              <button onMouseDown={e => e.stopPropagation()} onClick={onClose}
                style={{ width: 26, height: 26, borderRadius: 7, background: "#f1f5f9", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748b", transition: "all 0.15s", fontSize: 12 }}
                onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "#fca5a5"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = "#64748b"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
              ><CloseOutlined /></button>
            </div>
          </div>
          {!isMinimized && (
            <div style={{ position: "relative" }}>
              <SearchOutlined style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 12, pointerEvents: "none" }} />
              <input type="text" placeholder="Search devices…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onMouseDown={e => e.stopPropagation()}
                style={{ width: "100%", padding: "7px 10px 7px 29px", borderRadius: 8, border: "1px solid #dde5f0", fontSize: 12, outline: "none", background: "#fff", color: "#1e293b", boxSizing: "border-box", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }} />
            </div>
          )}
        </div>

        {/* Body */}
        {!isMinimized && (
          <div className="toolbox-panel-scroll" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "12px 12px 24px" }}>
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.8px" }}>Rooms</span>
                <button onClick={() => setShowAddModal(true)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 6, background: "#f0f9ff", border: "1px solid #bae6fd", color: "#0284c7", fontSize: 10, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#e0f2fe"; }} onMouseLeave={e => { e.currentTarget.style.background = "#f0f9ff"; }}>
                  <PlusOutlined style={{ fontSize: 9 }} /> Add Room
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {rooms.map(room => {
                  const c = room.hex || room.color;
                  const iconCls = room.icon?.startsWith("fa-") ? room.icon : `fa-${room.icon}`;
                  const isExp = expandedRoom === room.id;
                  return (
                    <div key={room.id} style={{ borderRadius: 10, border: `1.5px solid ${isExp ? c + "55" : "#e5eaf2"}`, background: isExp ? `${c}08` : "#fff", overflow: "hidden", transition: "all 0.18s", boxShadow: isExp ? `0 2px 10px ${c}18` : "none" }}>
                      <div onClick={() => setExpandedRoom(isExp ? null : room.id)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", cursor: "pointer" }}
                        onMouseEnter={e => { if (!isExp) e.currentTarget.style.background = `${c}08`; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: `${c}1a`, border: `1px solid ${c}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <i className={`fas ${iconCls}`} style={{ color: c, fontSize: 14, pointerEvents: "none" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{room.name}</div>
                          <div style={{ fontSize: 9.5, color: "#94a3b8", marginTop: 1 }}>{room.width}m × {room.length}m × {room.height}m</div>
                        </div>
                        <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
                          <Tooltip title="View in 3D Viewer">
                            <div onClick={e => { e.stopPropagation(); onViewRoom(room.id); }} style={{ width: 27, height: 27, borderRadius: 7, background: "#f0fdf4", border: "1px solid #86efac", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}
                              onMouseEnter={e => { e.currentTarget.style.background = "#dcfce7"; e.currentTarget.style.borderColor = "#4ade80"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "#f0fdf4"; e.currentTarget.style.borderColor = "#86efac"; }}>
                              <EyeFilled style={{ fontSize: 12, color: "#16a34a" }} />
                            </div>
                          </Tooltip>
                          <Tooltip title="Delete room">
                            <div onClick={e => handleDeleteClick(e, room)} style={{ width: 27, height: 27, borderRadius: 7, background: "#fff1f2", border: "1px solid #fca5a5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}
                              onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; e.currentTarget.style.borderColor = "#f87171"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "#fff1f2"; e.currentTarget.style.borderColor = "#fca5a5"; }}>
                              <DeleteOutlined style={{ fontSize: 11, color: "#ef4444" }} />
                            </div>
                          </Tooltip>
                          <CaretDownOutlined style={{ fontSize: 9, color: "#cbd5e1", transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                        </div>
                      </div>
                      {isExp && <RoomDevicePanel room={room} />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #dde5f0 40%, #dde5f0 60%, transparent)", margin: "4px 0 16px" }} />

            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 10 }}>Device Library</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
                {categories.map(cat => (
                  <button key={cat} onClick={() => setCategoryFilter(cat)}
                    style={{ padding: "3px 9px", borderRadius: 12, border: "none", background: categoryFilter === cat ? (CATEGORY_COLORS[cat] || "#3b82f6") : "#f1f5f9", color: categoryFilter === cat ? "#fff" : "#64748b", fontSize: 9.5, fontWeight: 600, cursor: "pointer", transition: "all 0.14s", boxShadow: categoryFilter === cat ? `0 2px 6px ${CATEGORY_COLORS[cat] || "#3b82f6"}44` : "none" }}>
                    {cat}
                  </button>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7 }}>
                {filteredDevices.map(dt => <DeviceTileLarge key={dt.name} dt={dt} />)}
              </div>
              {filteredDevices.length === 0 && <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8", fontSize: 12 }}>No devices match your search</div>}
            </div>
          </div>
        )}
      </div>

      {/* Add Room Modal */}
      {showAddModal && (
        <>
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100001 }} onClick={closeAddModal} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "white", padding: "24px", borderRadius: "8px", width: "400px", maxWidth: "95%", maxHeight: "90vh", overflowY: "auto", zIndex: 100002, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", color: "#0284c7" }}><PlusOutlined style={{ marginRight: 8, fontSize: "16px" }} />Add New Room</h2>
              <button onClick={closeAddModal} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "#666", padding: "4px" }}><CloseOutlined /></button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "#475569", marginBottom: 4, display: "block" }}>Room Name</label>
              <Input value={newRoom.name} onChange={e => setNewRoom({ ...newRoom, name: e.target.value })} placeholder="e.g., Network Room" size="small" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 24 }}>
              {[["Width (m)", "width"], ["Length (m)", "length"], ["Height (m)", "height"]].map(([lbl, key]) => (
                <div key={key}>
                  <label style={{ fontSize: 12, color: "#475569", marginBottom: 4, display: "block" }}>{lbl}</label>
                  <Input type="number" size="small" min={2} max={180} value={newRoom[key]} onChange={e => setNewRoom({ ...newRoom, [key]: parseInt(e.target.value) || 8 })} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button onClick={closeAddModal} style={{ padding: "6px 16px", border: "1px solid #d9d9d9", background: "white", borderRadius: "4px", cursor: "pointer", fontSize: "14px" }}>Cancel</button>
              <button onClick={handleAddRoom} style={{ padding: "6px 16px", background: "#0284c7", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}>Add Room</button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.open && (
        <>
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100002 }} onClick={cancelDelete} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "white", padding: "24px", borderRadius: "8px", width: "400px", maxWidth: "95%", maxHeight: "90vh", overflowY: "auto", zIndex: 100003, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", textAlign: "center" }}>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                <DeleteOutlined style={{ fontSize: "28px", color: "#ef4444" }} />
              </div>
            </div>
            <h2 style={{ color: "#ef4444", marginBottom: "8px", fontSize: "20px" }}>Delete Room</h2>
            <p style={{ fontSize: "14px", marginBottom: "16px", color: "#374151" }}>Are you sure you want to delete <strong>"{deleteConfirm.roomName}"</strong>?</p>
            <p style={{ margin: "0 0 20px 0", fontSize: "12px", color: "#94a3b8" }}>This will remove the room and all its placed devices from the 3D viewer. This action cannot be undone.</p>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
              <button onClick={cancelDelete} style={{ padding: "8px 24px", border: "1px solid #d9d9d9", background: "white", borderRadius: "4px", cursor: "pointer", fontSize: "14px" }}>Cancel</button>
              <button onClick={confirmDelete} style={{ padding: "8px 24px", background: "#ef4444", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}>Yes, Delete</button>
            </div>
          </div>
        </>
      )}

      <style>{`.toolbox-panel-scroll::-webkit-scrollbar{width:4px}.toolbox-panel-scroll::-webkit-scrollbar-thumb{background:#dde3ec;border-radius:4px}.toolbox-panel-scroll{scrollbar-width:thin;scrollbar-color:#dde3ec transparent}`}</style>
    </>,
    document.body
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION LABEL
// ─────────────────────────────────────────────────────────────────────────────
const SectionLabel = ({ label, collapsed }) => {
  if (collapsed) {
    return <div style={{ height: 1, background: "#e8edf5", margin: "6px 10px" }} />;
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px 4px", userSelect: "none" }}>
      <span style={{ fontSize: 9.5, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.9px", whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg, #e2e8f0, transparent)" }} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────
const Sidebar = ({ collapsed, isMobile, visible, onZoomRoom }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  useFontAwesome();

  const [toolboxOpen,   setToolboxOpen  ] = useState(false);
  const [rooms,         setRooms        ] = useState(DEFAULT_ROOMS);
  const [roomIdCounter, setRoomIdCounter] = useState(3);

  const getSelectedKey = () => {
    const p = location.pathname;
    if (p === "/co2-reports")       return ["co2-reports"];
    if (p === "/phosphine-reports") return ["phosphine-reports"];
    return [p.substring(1) || "dashboard"];
  };

  const handleAddRoom = ({ name, width, length, height }) => {
    const palettes = ["#9b59b6", "#e74c3c", "#1abc9c", "#f39c12", "#3498db", "#2ecc71"];
    const color = palettes[roomIdCounter % palettes.length];
    const newRoom = { id: roomIdCounter, name, color, hex: color, width, length, height, icon: "door-open", custom: true };
    setRooms(prev => [...prev, newRoom]);
    setRoomIdCounter(c => c + 1);
    dcimBus.emit("addRoom", newRoom);
  };

  const handleDeleteRoom = (id) => {
    setRooms(prev => prev.filter(r => r.id !== id));
    dcimBus.emit("deleteRoom", { id });
  };

  const handleViewRoom = (id) => {
    if (location.pathname !== "/dcim-viewer") navigate("/dcim-viewer");
    dcimBus.emit("zoomRoom", { id });
    if (onZoomRoom) onZoomRoom(id);
  };

  const accent = "#3b82f6";

  const menuItems = [
    // {
    //   key: "alerts",
    //   icon: <GlowIcon icon={AlertOutlined} glowColor={accent} isActive={location.pathname === "/alerts"} />,
    //   label: <MenuLabel isCollapsed={collapsed}><Link to="/alerts">Alerts</Link></MenuLabel>,
    // },
    // {
    //   key: "settings",
    //   icon: <GlowIcon icon={SettingOutlined} glowColor={accent} isActive={location.pathname === "/settings"} />,
    //   label: <MenuLabel isCollapsed={collapsed}><Link to="/settings">Settings</Link></MenuLabel>,
    // },
    { type: "divider", style: { margin: "6px 0", borderColor: "#e2e8f0" } },
  ];

  return (
    <>
      <ToolboxPanel
        open={toolboxOpen} onClose={() => setToolboxOpen(false)}
        collapsed={collapsed} rooms={rooms}
        onAddRoom={handleAddRoom} onDeleteRoom={handleDeleteRoom} onViewRoom={handleViewRoom}
      />

      <Sider
        trigger={null} collapsible collapsed={collapsed}
        width={SIDEBAR_WIDTH} collapsedWidth={SIDEBAR_COLLAPSED}
        style={{ position: "fixed", top: 0, bottom: 0, left: isMobile ? (visible ? 0 : "-100%") : 0, zIndex: 1000, height: "100vh", background: "#f8fafc", borderRight: "1px solid #e3e7ef", boxShadow: isMobile ? "0 0 15px rgba(0,0,0,0.1)" : "none", transition: "all 0.3s cubic-bezier(.4,0,.2,1)", display: "flex", flexDirection: "column", overflow: "hidden" }}
        className="dcim-sidebar"
      >
        {/* Logo */}
        <div onClick={() => { window.location.href = "/dcim-viewer"; }}
          style={{ height: 56, flexShrink: 0, display: "flex", alignItems: "center", paddingLeft: collapsed ? 18 : 16, gap: 10, borderBottom: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer" }}>
          <img src={Logo} alt="DCIM" style={{ height: 34, width: 34, borderRadius: 8, border: "2px solid #bfdbfe", flexShrink: 0 }} />
          {!collapsed && <span style={{ color: "#3b82f6", fontWeight: 700, fontSize: 17, letterSpacing: ".4px" }}>DCIM Monitor</span>}
        </div>

        {/* Main Dashboard start */}
        {/* 3D View trigger */}
        <Tooltip title={collapsed ? "Dashboard" : ""} placement="right">
          <div onClick={() => navigate("/display-dash-animate")}
            style={{ flexShrink: 0, height: 48, display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 10, padding: collapsed ? 0 : "0 14px", cursor: "pointer", borderBottom: "1px solid #e2e8f0", background: location.pathname === "/display-dash-animate" ? "linear-gradient(90deg, #dbeafe 0%, #eff6ff 100%)" : "transparent", transition: "background 0.2s", userSelect: "none", position: "relative" }}
            onMouseEnter={e => { if (location.pathname !== "display-dash-animate") e.currentTarget.style.background = "#f0f7ff"; }}
            onMouseLeave={e => { if (location.pathname !== "display-dash-animate") e.currentTarget.style.background = "transparent"; }}
          >
            {location.pathname === "/display-dash-animate" && <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 24, borderRadius: "0 3px 3px 0", background: "#3b82f6" }} />}
            <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: location.pathname === "/display-dash-animate" ? "linear-gradient(135deg, #3b82f6, #1d4ed8)" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: location.pathname === "/display-dash-animate" ? "0 2px 8px #3b82f650" : "none", transition: "all 0.2s" }}>
              <DashboardOutlined style={{ fontSize: 15, color: location.pathname === "/display-dash-animate" ? "#fff" : "#64748b" }} />
            </div>
            {!collapsed && <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: location.pathname === "/display-dash-animate" ? "#2563eb" : "#1e293b" }}>Dashboard</span>}
          </div>
        </Tooltip>
        {/* Main Dashboard end */}

        {/* 3D View trigger */}
        <Tooltip title={collapsed ? "3D View" : ""} placement="right">
          <div onClick={() => navigate("/dcim-viewer")}
            style={{ flexShrink: 0, height: 48, display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 10, padding: collapsed ? 0 : "0 14px", cursor: "pointer", borderBottom: "1px solid #e2e8f0", background: location.pathname === "/dcim-viewer" ? "linear-gradient(90deg, #dbeafe 0%, #eff6ff 100%)" : "transparent", transition: "background 0.2s", userSelect: "none", position: "relative" }}
            onMouseEnter={e => { if (location.pathname !== "/dcim-viewer") e.currentTarget.style.background = "#f0f7ff"; }}
            onMouseLeave={e => { if (location.pathname !== "/dcim-viewer") e.currentTarget.style.background = "transparent"; }}
          >
            {location.pathname === "/dcim-viewer" && <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 24, borderRadius: "0 3px 3px 0", background: "#3b82f6" }} />}
            <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: location.pathname === "/dcim-viewer" ? "linear-gradient(135deg, #3b82f6, #1d4ed8)" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: location.pathname === "/dcim-viewer" ? "0 2px 8px #3b82f650" : "none", transition: "all 0.2s" }}>
              <ApartmentOutlined style={{ fontSize: 15, color: location.pathname === "/dcim-viewer" ? "#fff" : "#64748b" }} />
            </div>
            {!collapsed && <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: location.pathname === "/dcim-viewer" ? "#2563eb" : "#1e293b" }}>3D View</span>}
          </div>
        </Tooltip>

        {/* ToolBox trigger */}
        <Tooltip title={collapsed ? "ToolBox" : ""} placement="right">
          <div onClick={() => setToolboxOpen(p => !p)}
            style={{ flexShrink: 0, height: 48, display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 10, padding: collapsed ? 0 : "0 14px", cursor: "pointer", borderBottom: "1px solid #e2e8f0", background: toolboxOpen ? "linear-gradient(90deg, #dbeafe 0%, #eff6ff 100%)" : "transparent", transition: "background 0.2s", userSelect: "none", position: "relative" }}
            onMouseEnter={e => { if (!toolboxOpen) e.currentTarget.style.background = "#f0f7ff"; }}
            onMouseLeave={e => { if (!toolboxOpen) e.currentTarget.style.background = "transparent"; }}
          >
            {toolboxOpen && <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 24, borderRadius: "0 3px 3px 0", background: "#3b82f6" }} />}
            <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: toolboxOpen ? "linear-gradient(135deg, #3b82f6, #1d4ed8)" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: toolboxOpen ? "0 2px 8px #3b82f650" : "none", transition: "all 0.2s" }}>
              <AppstoreOutlined style={{ fontSize: 15, color: toolboxOpen ? "#fff" : "#64748b" }} />
            </div>
            {!collapsed && (
              <>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: toolboxOpen ? "#2563eb" : "#1e293b" }}>ToolBox</span>
                <span style={{ background: toolboxOpen ? "#bfdbfe" : "#e0edff", color: "#3b82f6", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "1px 7px", transition: "background 0.2s" }}>{rooms.length}</span>
                <CaretDownOutlined style={{ fontSize: 10, color: "#94a3b8", marginLeft: 4, transform: "rotate(-90deg)", opacity: toolboxOpen ? 1 : 0.5, transition: "all 0.2s" }} />
              </>
            )}
          </div>
        </Tooltip>

        {/* ── Nav scroll area ── */}
        <div className="nav-scroll" style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch", padding: "6px 0" }}>

          {/* 1️⃣  Core Infrastructure (with nested Asset submenu) */}
          <SubDropdown
            label="Asset Management"
            headerIcon={DatabaseOutlined}
            subItems={CORE_INFRASTRUCTURE_SUB_ITEMS}
            collapsed={collapsed}
            pathname={location.pathname}
          />

          {/* ── Monitoring & Operations ── */}
          <SectionLabel collapsed={collapsed} />
          <SubDropdown
            label="Monitoring & Operations"
            headerIcon={HeatMapOutlined}
            subItems={MONITORING_OPERATIONS_SUB_ITEMS}
            collapsed={collapsed}
            pathname={location.pathname}
          />

          {/* ── Planning & Optimization ── */}
          <SectionLabel collapsed={collapsed} />
          <SubDropdown
            label="Planning & Optimization"
            headerIcon={LineChartOutlined}
            subItems={PLANNING_OPTIMIZATION_SUB_ITEMS}
            collapsed={collapsed}
            pathname={location.pathname}
          />

          {/* ── Intelligence & Analysis ── */}
          <SectionLabel collapsed={collapsed} />
          <SubDropdown
            label="Intelligence & Analysis"
            headerIcon={RobotOutlined}
            subItems={INTELLIGENCE_ANALYSIS_SUB_ITEMS}
            collapsed={collapsed}
            pathname={location.pathname}
          />

          {/* ── Governance & Enterprise ── */}
          <SectionLabel collapsed={collapsed} />
          <SubDropdown
            label="Governance & Enterprise"
            headerIcon={AuditOutlined}
            subItems={GOVERNANCE_ENTERPRISE_SUB_ITEMS}
            collapsed={collapsed}
            pathname={location.pathname}
          />

          {/* Divider */}
          <div style={{ height: 1, background: "#e8edf5", margin: "4px 10px 2px" }} />

          {/* 2️⃣  Alerts + Settings */}
          <Menu
            mode="inline"
            inlineCollapsed={collapsed}
            selectedKeys={getSelectedKey()}
            style={{ background: "transparent", borderRight: "none", fontSize: 15, padding: "0" }}
            items={menuItems}
          />

          {/* 3️⃣  Billing/Packages */}
          <SubDropdown
            label="Master"
            headerIcon={AppstoreOutlined}
            subItems={PACKAGES_SUB_ITEMS_MASTER}
            collapsed={collapsed}
            pathname={location.pathname}
          />

          <SubDropdown
            label="Billing"
            headerIcon={AppstoreOutlined}
            subItems={PACKAGES_SUB_ITEMS}
            collapsed={collapsed}
            pathname={location.pathname}
          />

        </div>
      </Sider>

      <style>{`
        .nav-scroll::-webkit-scrollbar { width: 3px; }
        .nav-scroll::-webkit-scrollbar-thumb { background: #dde3ec; border-radius: 4px; }
        .nav-scroll { scrollbar-width: thin; scrollbar-color: #dde3ec transparent; }
        .dcim-sidebar .ant-menu { background: transparent; }
        .dcim-sidebar .ant-menu-item,
        .dcim-sidebar .ant-menu-submenu-title {
          padding-left: 14px !important; padding-right: 8px !important;
          display: flex; align-items: center; font-size: 15px; color: #1e293b;
          min-height: 42px; border-radius: 8px; margin: 2px 4px;
        }
        .dcim-sidebar .ant-menu-item-selected {
          background: linear-gradient(90deg, #dbeafe 40%, #f1f5fa 100%) !important;
          border-left: 3px solid #3b82f6; color: #3b82f6 !important;
        }
        .dcim-sidebar .ant-menu-item:hover,
        .dcim-sidebar .ant-menu-submenu-title:hover { background: #f1f5fa !important; color: #3b82f6 !important; }
        .dcim-sidebar .ant-menu-sub { background: #f4f6fa !important; border-radius: 6px; overflow: visible !important; }
        .dcim-sidebar .ant-menu-sub .ant-menu-item { padding-left: 14px !important; height: auto !important; white-space: normal !important; }
        .dcim-sidebar .ant-menu-submenu-arrow { color: #94a3b8 !important; }
        .dcim-sidebar .ant-menu-submenu-selected > .ant-menu-submenu-title { color: #3b82f6 !important; }

        .dcim-sidebar {
          display: flex !important;
          flex-direction: column !important;
          overflow: hidden !important;
        }

        .dcim-sidebar > .ant-layout-sider-children {
          display: flex !important;
          flex-direction: column !important;
          overflow: hidden !important;
          height: 100% !important;
          min-height: 0 !important;
        }
      `}</style>
    </>
  );
};

Sidebar.defaultProps = { collapsed: false, isMobile: false, visible: true };
export default Sidebar;

//---------------------------------testing wall ac unit room end--------------------------------
