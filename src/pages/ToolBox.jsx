// import React, { useState, useEffect, useRef, useCallback } from "react";
// import ReactDOM from "react-dom";
// import { Input, Tooltip } from "antd";
// import {
//   PlusCircleFilled,
//   CaretDownOutlined,
//   PlusOutlined,
//   DeleteOutlined,
//   EyeFilled,
//   AppstoreOutlined,
//   CloseOutlined,
//   SearchOutlined,
// } from "@ant-design/icons";

// // ─────────────────────────────────────────────────────────────────────────────
// // SHARED CONSTANTS / EVENT BUS
// // ─────────────────────────────────────────────────────────────────────────────
// export const TOOLBOX_WIDTH = 310;

// export const ROOM_MARGIN_UNITS = [
//   { value: "mm", label: "Millimeters (mm)" },
//   { value: "cm", label: "Centimeters (cm)" },
//   { value: "m",  label: "Meters (m)" },
//   { value: "ft", label: "Feet (ft)" },
//   { value: "in", label: "Inches (in)" },
// ];

// export const DEVICE_TYPES = [
//   { name: "Server Rack",        icon: "fa-server",           color: "#3498db", category: "Compute",         power: "1-5kW"    },
//   { name: "Blade Server",       icon: "fa-sitemap",          color: "#2980b9", category: "Compute",         power: "0.5-2kW"  },
//   { name: "AC Unit",            icon: "fa-snowflake",        color: "#2ecc71", category: "Cooling",         power: "5-20kW"   },
//   { name: "Wall AC",            icon: "fa-wind",             color: "#00b4d8", category: "Cooling",         power: "1-5kW"    },
//   { name: "Chiller",            icon: "fa-fan",              color: "#16a085", category: "Cooling",         power: "10-100kW" },
//   { name: "CRAC Unit",          icon: "fa-temperature-low",  color: "#1abc9c", category: "Cooling",         power: "5-30kW"   },
//   { name: "DG Set",             icon: "fa-bolt",             color: "#e67e22", category: "Power",           power: "50-500kW" },
//   { name: "UPS",                icon: "fa-car-battery",      color: "#f39c12", category: "Power",           power: "1-100kVA" },
//   { name: "PDU",                icon: "fa-plug",             color: "#1abc9c", category: "Power",           power: "10-100A"  },
//   { name: "Network Switch",     icon: "fa-network-wired",    color: "#9b59b6", category: "Network",         power: "100-500W" },
//   { name: "Router",             icon: "fa-route",            color: "#e74c3c", category: "Network",         power: "50-300W"  },
//   { name: "Firewall",           icon: "fa-shield-alt",       color: "#c0392b", category: "Security",        power: "100-400W" },
//   { name: "Storage Array",      icon: "fa-hdd",              color: "#34495e", category: "Storage",         power: "1-10kW"   },
//   { name: "CCTV Camera",        icon: "fa-video",            color: "#8e44ad", category: "Security",        power: "20-50W"   },
//   { name: "FM200 System",       icon: "fa-fire",             color: "#f39c12", category: "Safety",          power: "200-500W" },
//   { name: "Humidifier",         icon: "fa-tint",             color: "#3498db", category: "Environment",     power: "0.5-5kW"  },
//   // ── DC Infrastructure devices ──
//   { name: "PAC Unit",                     icon: "fa-fan",              color: "#0891b2", category: "Cooling",         power: "5-20kW"   },
//   { name: "PAC Panel",                     icon: "fa-table-cells",      color: "#0891b2", category: "Cooling",         power: "N/A"      },
//   { name: "Distribution Panel",            icon: "fa-table-cells-large", color: "#6366f1", category: "Power",           power: "10-100A"  },
//   { name: "Camera",                        icon: "fa-camera",           color: "#dc2626", category: "Security",        power: "15-30W"   },
//   { name: "Door",                          icon: "fa-door-open",        color: "#92400e", category: "Infrastructure",  power: "N/A"      },
//   { name: "Battery Bank",                  icon: "fa-battery-full",     color: "#059669", category: "Power",           power: "5-50kW"   },
// ];

// export const CATEGORY_COLORS = {
//   Compute: "#3498db", Cooling: "#2ecc71", Power: "#f39c12",
//   Network: "#9b59b6", Security: "#e74c3c", Storage: "#34495e",
//   Safety: "#e67e22",  Environment: "#1abc9c",
//   Floor: "#94a3b8",   Infrastructure: "#92400e",
// };

// export const ROOM_TYPES = [
//   { value: "server",     label: "Server Room",     color: "#3498db", icon: "server"        },
//   { value: "ac",         label: "AC Unit Room",    color: "#2ecc71", icon: "snowflake"     },
//   { value: "dg",         label: "DG Set Room",     color: "#e67e22", icon: "bolt"          },
//   { value: "electrical", label: "Electrical Room", color: "#f39c12", icon: "plug"          },
//   { value: "network",    label: "Network Room",    color: "#9b59b6", icon: "network-wired" },
//   { value: "storage",    label: "Storage Room",    color: "#34495e", icon: "hdd"           },
//   { value: "ups",        label: "UPS Room",        color: "#1abc9c", icon: "car-battery"   },
//   { value: "chiller",    label: "Chiller Room",    color: "#16a085", icon: "fan"           },
//   { value: "custom",     label: "Custom Room",     color: "#95a5a6", icon: "door-open"     },
// ];

// export const dcimBus = {
//   emit(event, data) {
//     window.dispatchEvent(new CustomEvent(`dcim:${event}`, { detail: data }));
//   },
//   on(event, handler) {
//     window.addEventListener(`dcim:${event}`, handler);
//     return () => window.removeEventListener(`dcim:${event}`, handler);
//   },
// };

// let globalDragActive = false;

// export const useFontAwesome = () => {
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
//     onDragEnd() {
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
//         <span style={{ fontSize: 9.5, fontWeight: 600, color: "#374151", textAlign: "center", lineHeight: 1.3, maxWidth: 72, wordBreak: "break-word" }}>{dt.name}</span>
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

// // Every room is created as a clean, empty room — no server-room-specific
// // rack/PAC-unit fields or auto-generated placeholders. Devices are added
// // afterward by dragging them from the Device Library into the 3D viewer,
// // where their exact L×W dimensions are captured before placement.
// const DEFAULT_NEW_ROOM = {
//   name: "", type: "server", width: 20, length: 20, height: 8, kw: 0,
//   dimUnit: "m",
//   margins: { top: 0, bottom: 0, left: 0, right: 0, unit: "m" },
//   innerMargins: { top: 0, bottom: 0, left: 0, right: 0 },
// };

// const Toolbox = ({ open, onClose, anchorX = 12, rooms = [], onAddRoom, onDeleteRoom, onViewRoom }) => {
//   useFontAwesome();

//   const [searchTerm,     setSearchTerm    ] = useState("");
//   const [categoryFilter, setCategoryFilter] = useState("All");
//   const [expandedRoom,   setExpandedRoom  ] = useState(null);
//   const [showAddModal,   setShowAddModal  ] = useState(false);
//   const [newRoom, setNewRoom] = useState({ ...DEFAULT_NEW_ROOM });
//   const [isDragging,     setIsDragging    ] = useState(false);
//   const [deleteConfirm,  setDeleteConfirm ] = useState({ open: false, roomId: null, roomName: "" });

//   const [panelPos, setPanelPos] = useState({ x: anchorX + 12, y: 60 });
//   const [isMinimized, setIsMinimized] = useState(false);

//   const draggingPanel = useRef(false);
//   const dragOffset    = useRef({ x: 0, y: 0 });
//   const panelRef      = useRef(null);

//   useEffect(() => { setPanelPos(prev => ({ ...prev, x: anchorX + 12 })); }, [anchorX]);

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
//     const payload = {
//       ...newRoom,
//       innerMargins: { ...newRoom.innerMargins },
//     };
//     onAddRoom?.(payload);
//     setNewRoom({ ...DEFAULT_NEW_ROOM });
//     setShowAddModal(false);
//   };

//   const handleDeleteClick = (e, room) => { e.stopPropagation(); setDeleteConfirm({ open: true, roomId: room.id, roomName: room.name }); };
//   const confirmDelete = () => { onDeleteRoom?.(deleteConfirm.roomId); setExpandedRoom(prev => prev === deleteConfirm.roomId ? null : prev); setDeleteConfirm({ open: false, roomId: null, roomName: "" }); };
//   const cancelDelete  = () => setDeleteConfirm({ open: false, roomId: null, roomName: "" });
//   const closeAddModal = () => { setShowAddModal(false); setNewRoom({ ...DEFAULT_NEW_ROOM }); };

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
//                 <div style={{ fontSize: 10, color: "#64748b" }}>{rooms.length} rooms · {DEVICE_TYPES.length} devices</div>
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
//                           <div style={{ fontSize: 9.5, color: "#94a3b8", marginTop: 1 }}>
//                             {room.width}{room.dimUnit || "m"} × {room.length}{room.dimUnit || "m"} × {room.height}{room.dimUnit || "m"}
//                           </div>
//                         </div>
//                         <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
//                           <Tooltip title="View in 3D Viewer">
//                             <div onClick={e => { e.stopPropagation(); onViewRoom?.(room.id); }} style={{ width: 27, height: 27, borderRadius: 7, background: "#f0fdf4", border: "1px solid #86efac", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}
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

//       {/* Add Room Modal — every room is now created as a clean, empty room */}
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
//               <div style={{ marginBottom: 16, marginTop: 16 }}>
//                 <label style={{ fontSize: 12, color: "#475569", marginBottom: 4, display: "block" }}>Room Type</label>
//                 <select value={newRoom.type} onChange={e => setNewRoom({ ...newRoom, type: e.target.value })}
//                   style={{ width: "100%", padding: "5px 8px", borderRadius: 6, border: "1px solid #d9d9d9", fontSize: 13, outline: "none", background: "#fff", color: "#1e293b", boxSizing: "border-box", cursor: "pointer" }}>
//                   {[{ value: "server", label: "Server Room", icon: "🖥️" },{ value: "ac", label: "AC Unit Room", icon: "❄️" },{ value: "dg", label: "DG Set Room", icon: "⚡" },{ value: "electrical", label: "Electrical Room", icon: "🔌" },{ value: "network", label: "Network Room", icon: "🌐" },{ value: "storage", label: "Storage Room", icon: "💾" },{ value: "ups", label: "UPS Room", icon: "🔋" },{ value: "chiller", label: "Chiller Room", icon: "🌀" },{ value: "custom", label: "Custom Room", icon: "🚪" }].map(rt => (
//                     <option key={rt.value} value={rt.value}>{rt.icon} {rt.label}</option>
//                   ))}
//                 </select>
//               </div>
//               <div style={{ marginBottom: 16, padding: 10, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
//                 <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.4 }}>
//                   <i className="fas fa-info-circle" style={{ marginRight: 4 }} />
//                   Rooms are created empty. Once added, drag devices from the Device Library into the 3D viewer — you'll be asked for each device's exact footprint (L × W in mm) before it's placed.
//                 </div>
//               </div>
//               <div style={{ marginBottom: 16 }}>
//                 <label style={{ fontSize: 12, color: "#475569", marginBottom: 4, display: "block" }}>Power Load (kW) <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span></label>
//                 <input type="number" min={0} value={newRoom.kw} onChange={e => setNewRoom({ ...newRoom, kw: parseFloat(e.target.value) || 0 })} placeholder="e.g., 500"
//                   style={{ width: "100%", padding: "5px 10px", borderRadius: 6, border: "1px solid #d9d9d9", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
//               </div>
//             </div>
//             <div style={{ marginBottom: 20 }}>
//               <label style={{ fontSize: 12, color: "#475569", marginBottom: 6, display: "block", fontWeight: 600 }}>
//                 Room Margin <span style={{ color: "#94a3b8", fontWeight: 400 }}>(space around this room)</span>
//               </label>
//               <div style={{ marginBottom: 8 }}>
//                 <label style={{ fontSize: 11, color: "#64748b", marginBottom: 4, display: "block" }}>Margin Unit</label>
//                 <select value={newRoom.margins.unit} onChange={e => setNewRoom({ ...newRoom, margins: { ...newRoom.margins, unit: e.target.value } })}
//                   style={{ width: "100%", padding: "5px 8px", borderRadius: 6, border: "1px solid #d9d9d9", fontSize: 13, outline: "none", background: "#fff", color: "#1e293b", boxSizing: "border-box", cursor: "pointer" }}>
//                   {ROOM_MARGIN_UNITS.map(u => (<option key={u.value} value={u.value}>{u.label}</option>))}
//                 </select>
//               </div>
//               <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
//                 {["top", "bottom", "left", "right"].map(side => (
//                   <div key={side}>
//                     <label style={{ fontSize: 10, color: "#64748b", marginBottom: 3, display: "block", textTransform: "capitalize" }}>{side}</label>
//                     <input type="number" min={0} value={newRoom.margins[side]}
//                       onChange={e => setNewRoom({ ...newRoom, margins: { ...newRoom.margins, [side]: parseFloat(e.target.value) || 0 } })}
//                       placeholder="0" style={{ width: "100%", padding: "5px 8px", borderRadius: 6, border: "1px solid #d9d9d9", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
//                   </div>
//                 ))}
//               </div>
//             </div>
//             <div style={{ marginBottom: 20 }}>
//               <label style={{ fontSize: 12, color: "#475569", marginBottom: 6, display: "block", fontWeight: 600 }}>
//                 Internal Margin <span style={{ color: "#94a3b8", fontWeight: 400 }}>(inside room, near walls)</span>
//               </label>
//               <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
//                 {["top", "bottom", "left", "right"].map(side => (
//                   <div key={side}>
//                     <label style={{ fontSize: 10, color: "#64748b", marginBottom: 3, display: "block", textTransform: "capitalize" }}>{side}</label>
//                     <input type="number" min={0} value={newRoom.innerMargins[side]}
//                       onChange={e => setNewRoom({ ...newRoom, innerMargins: { ...newRoom.innerMargins, [side]: parseFloat(e.target.value) || 0 } })}
//                       placeholder="0" style={{ width: "100%", padding: "5px 8px", borderRadius: 6, border: "1px solid #d9d9d9", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
//                   </div>
//                 ))}
//               </div>
//             </div>

//             <div style={{ marginBottom: 12 }}>
//               <label style={{ fontSize: 12, color: "#475569", marginBottom: 4, display: "block" }}>Dimension Unit</label>
//               <select value={newRoom.dimUnit} onChange={e => setNewRoom({ ...newRoom, dimUnit: e.target.value })}
//                 style={{ width: "100%", padding: "5px 8px", borderRadius: 6, border: "1px solid #d9d9d9", fontSize: 13, outline: "none", background: "#fff", color: "#1e293b", boxSizing: "border-box", cursor: "pointer" }}>
//                 {ROOM_MARGIN_UNITS.map(u => (<option key={u.value} value={u.value}>{u.label}</option>))}
//               </select>
//             </div>
//             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 24 }}>
//               {[["Width", "width"], ["Length", "length"], ["Height", "height"]].map(([lbl, key]) => (
//                 <div key={key}>
//                   <label style={{ fontSize: 12, color: "#475569", marginBottom: 4, display: "block" }}>{lbl} ({newRoom.dimUnit})</label>
//                   <Input type="number" size="small" min={0.1} value={newRoom[key]} onChange={e => setNewRoom({ ...newRoom, [key]: parseFloat(e.target.value) || 0 })} />
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
//           <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "white", padding: "24px", borderRadius: "8px", width: "400px", maxWidth: "95%", zIndex: 100003, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", textAlign: "center" }}>
//             <div style={{ marginBottom: "16px" }}>
//               <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
//                 <DeleteOutlined style={{ fontSize: "28px", color: "#ef4444" }} />
//               </div>
//             </div>
//             <h2 style={{ color: "#ef4444", marginBottom: "8px", fontSize: "20px" }}>Delete Room</h2>
//             <p style={{ fontSize: "14px", marginBottom: "16px", color: "#374151" }}>Are you sure you want to delete <strong>"{deleteConfirm.roomName}"</strong>?</p>
//             <p style={{ margin: "0 0 20px 0", fontSize: "12px", color: "#94a3b8" }}>This action cannot be undone.</p>
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

// export default Toolbox;




//=================================================================================================================






import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { Input, Tooltip } from "antd";
import {
  PlusCircleFilled,
  CaretDownOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeFilled,
  AppstoreOutlined,
  CloseOutlined,
  SearchOutlined,
  EditOutlined,
  ApiOutlined,
  AimOutlined,
} from "@ant-design/icons";
import { DeviceIcon } from "./DeviceIcons";

// ─────────────────────────────────────────────────────────────────────────────
// SHARED CONSTANTS / EVENT BUS
// ─────────────────────────────────────────────────────────────────────────────
export const TOOLBOX_WIDTH = 310;

export const ROOM_MARGIN_UNITS = [
  { value: "mm", label: "Millimeters (mm)" },
  { value: "cm", label: "Centimeters (cm)" },
  { value: "m",  label: "Meters (m)" },
  { value: "ft", label: "Feet (ft)" },
  { value: "in", label: "Inches (in)" },
];

// Room width/length/height are always stored (and consumed by the 3D view)
// as canonical meters. The "Add Room (exact size)" form lets the user type
// in mm/cm/m/ft/in — this table converts whatever they typed into meters
// once, at submit time, so nothing downstream ever has to know or guess
// which unit a room's raw numbers were entered in.
export const DIM_UNIT_TO_METERS = { mm: 0.001, cm: 0.01, m: 1, ft: 0.3048, in: 0.0254 };

// Each device type may optionally carry `defaultDimensions` (mm). These
// pre-fill the existing L×W dimension modal and drive the ghost-preview
// footprint shown while dragging/placing — the user can still change them
// before the device is actually placed. Devices without an entry simply
// fall back to the modal's existing 600×600 default (unchanged behavior).
export const DEVICE_TYPES = [
  { name: "Server Rack",        icon: "fa-server",           svgIcon: "rack", shape: "rack", color: "#3498db", category: "Compute",         power: "1-5kW",    defaultDimensions: { lengthMm: 600, widthMm: 1000, heightMm: 2000 } },
  { name: "Blade Server",       icon: "fa-sitemap",          svgIcon: "bladeserver", shape: "bladeserver", color: "#2980b9", category: "Compute",         power: "0.5-2kW",  defaultDimensions: { lengthMm: 600, widthMm: 900,  heightMm: 2000 } },
  { name: "AC Unit",            icon: "fa-snowflake",        svgIcon: "crac", shape: "crac", color: "#2ecc71", category: "Cooling",         power: "5-20kW",   defaultDimensions: { lengthMm: 1000, widthMm: 600, heightMm: 1900 } },
  { name: "Chiller",            icon: "fa-fan",              svgIcon: "chiller", shape: "chiller", color: "#16a085", category: "Cooling",         power: "10-100kW", defaultDimensions: { lengthMm: 1800, widthMm: 1200, heightMm: 2200 } },
  { name: "CRAC Unit",          icon: "fa-temperature-low",  svgIcon: "crac", shape: "crac", color: "#1abc9c", category: "Cooling",         power: "5-30kW",   defaultDimensions: { lengthMm: 1200, widthMm: 600, heightMm: 1900 } },
  { name: "DG Set",             icon: "fa-bolt",             svgIcon: "generator", shape: "generator", color: "#e67e22", category: "Power",           power: "50-500kW", defaultDimensions: { lengthMm: 3000, widthMm: 1200, heightMm: 2000 } },
  { name: "UPS",                icon: "fa-car-battery",      svgIcon: "ups",  shape: "ups",  color: "#f39c12", category: "Power",           power: "1-100kVA", defaultDimensions: { lengthMm: 1200, widthMm: 800, heightMm: 1900 } },
  { name: "PDU",                icon: "fa-plug",             svgIcon: "pdu",  shape: "pdu",  color: "#1abc9c", category: "Power",           power: "10-100A",  defaultDimensions: { lengthMm: 600,  widthMm: 600, heightMm: 2000 } },
  { name: "Network Switch",     icon: "fa-network-wired",    svgIcon: "switch", shape: "switch", color: "#9b59b6", category: "Network",         power: "100-500W", defaultDimensions: { lengthMm: 600, widthMm: 1000, heightMm: 2000 } },
  { name: "Router",             icon: "fa-route",            svgIcon: "router", shape: "router", color: "#e74c3c", category: "Network",         power: "50-300W",  defaultDimensions: { lengthMm: 600, widthMm: 1000, heightMm: 2000 } },
  { name: "Firewall",           icon: "fa-shield-alt",       svgIcon: "firewall", shape: "firewall", color: "#c0392b", category: "Security",        power: "100-400W", defaultDimensions: { lengthMm: 600, widthMm: 1000, heightMm: 2000 } },
  { name: "Storage Array",      icon: "fa-hdd",              svgIcon: "storage", shape: "storage", color: "#34495e", category: "Storage",         power: "1-10kW",   defaultDimensions: { lengthMm: 600, widthMm: 1000, heightMm: 2000 } },
  { name: "CCTV Camera",        icon: "fa-video",            svgIcon: "camera", shape: "camera", color: "#8e44ad", category: "Security",        power: "20-50W",   defaultDimensions: { lengthMm: 300, widthMm: 300, heightMm: 300  } },
  { name: "FM200 System",       icon: "fa-fire",             svgIcon: "fm200", shape: "fm200", color: "#f39c12", category: "Safety",          power: "200-500W", defaultDimensions: { lengthMm: 600, widthMm: 600, heightMm: 1600 } },
  { name: "Humidifier",         icon: "fa-tint",             svgIcon: "humidifier", shape: "humidifier", color: "#3498db", category: "Environment",     power: "0.5-5kW",  defaultDimensions: { lengthMm: 600, widthMm: 600, heightMm: 1800 } },
  // ── DC Infrastructure devices ──
  { name: "PAC Unit",                     icon: "fa-fan",              svgIcon: "crac", shape: "crac", color: "#0891b2", category: "Cooling",         power: "5-20kW",  defaultDimensions: { lengthMm: 1200, widthMm: 800, heightMm: 1900 } },
  { name: "PAC Panel",                     icon: "fa-table-cells",      svgIcon: "pp", shape: "pp", color: "#0891b2", category: "Cooling",         power: "N/A",     defaultDimensions: { lengthMm: 600, widthMm: 600, heightMm: 2000 } },
  { name: "Distribution Panel",            icon: "fa-table-cells-large", svgIcon: "pp", shape: "pp", color: "#6366f1", category: "Power",           power: "10-100A", defaultDimensions: { lengthMm: 600, widthMm: 600, heightMm: 2000 } },
  { name: "Camera",                        icon: "fa-camera",           svgIcon: "camera", shape: "camera", color: "#dc2626", category: "Security",        power: "15-30W",  defaultDimensions: { lengthMm: 300, widthMm: 300, heightMm: 300  } },
  { name: "Door",                          icon: "fa-door-open",        svgIcon: "door", shape: "door", color: "#92400e", category: "Infrastructure",  power: "N/A",     defaultDimensions: { lengthMm: 900, widthMm: 100, heightMm: 2100 } },
  { name: "Battery Bank",                  icon: "fa-battery-full",     svgIcon: "battery", shape: "battery", color: "#059669", category: "Power",           power: "5-50kW",  defaultDimensions: { lengthMm: 1200, widthMm: 800, heightMm: 1200 } },
  // ── From the reference floor-layout sheet ──
  { name: "Access Card Reader",            icon: "fa-id-card",          svgIcon: "cardreader", shape: "cardreader", color: "#7c3aed", category: "Security",        power: "5-10W",   defaultDimensions: { lengthMm: 150, widthMm: 100, heightMm: 150 } },
  { name: "Biometric Access",              icon: "fa-fingerprint",      svgIcon: "biometric", shape: "biometric", color: "#7c3aed", category: "Security",        power: "5-10W",   defaultDimensions: { lengthMm: 150, widthMm: 100, heightMm: 150 } },
  { name: "FM200 Cylinder",                icon: "fa-fire-extinguisher",svgIcon: "fm200cyl", shape: "fm200cyl", color: "#f97316", category: "Safety",          power: "N/A",     defaultDimensions: { lengthMm: 400, widthMm: 400, heightMm: 1500 } },
  { name: "Push Button - Access",          icon: "fa-hand-point-up",    svgIcon: "pushbutton", shape: "pushbutton", color: "#ef4444", category: "Security",        power: "N/A",     defaultDimensions: { lengthMm: 150, widthMm: 100, heightMm: 150 } },
  { name: "iPDU",                          icon: "fa-plug-circle-bolt", svgIcon: "ipdu", shape: "ipdu", color: "#1abc9c", category: "Power",           power: "10-32A",  defaultDimensions: { lengthMm: 600, widthMm: 100, heightMm: 300 } },
  { name: "Power Source",                  icon: "fa-bolt-lightning",   svgIcon: "busway", shape: "busway", color: "#eab308", category: "Power",           power: "N/A",     defaultDimensions: { lengthMm: 3000, widthMm: 400, heightMm: 2800 } },
  { name: "Emergency Exit",                icon: "fa-person-running",   svgIcon: "exitsign", shape: "exitsign", color: "#16a34a", category: "Safety",          power: "N/A",     defaultDimensions: { lengthMm: 900, widthMm: 100, heightMm: 2100 } },
  // ── Access/circulation & power-distribution additions ──
  // (CCTV Camera, Biometric Access, Access Card Reader, FM200 Cylinder(s),
  // Push Button - Access, PDU, Distribution Panel, UPS and Battery Bank were
  // requested again here but already exist above under the same or an
  // equivalent name, so they were intentionally left as-is and not duplicated.)
  { name: "Stairs & Ramp",                 icon: "fa-stairs",           svgIcon: "stairs", shape: "stairs", color: "#854d0e", category: "Infrastructure",  power: "N/A",     defaultDimensions: { lengthMm: 2400, widthMm: 1800, heightMm: 1000 } },
  { name: "BR (Breaker)",                  icon: "fa-toggle-on",        svgIcon: "breaker", shape: "breaker", color: "#991b1b", category: "Power",           power: "16-100A", defaultDimensions: { lengthMm: 600,  widthMm: 600,  heightMm: 2000 } },
  { name: "ISP Rack",                      icon: "fa-tower-broadcast",  svgIcon: "isprack", shape: "isprack", color: "#4f46e5", category: "Network",         power: "100-500W",defaultDimensions: { lengthMm: 600,  widthMm: 1000, heightMm: 2000 } },
  { name: "Tap-Off Box",                   icon: "fa-code-branch",      svgIcon: "tapoff", shape: "tapoff", color: "#2563eb", category: "Power",           power: "16-63A",  defaultDimensions: { lengthMm: 400,  widthMm: 150,  heightMm: 300  } },
  { name: "UPS/WLD Panel",                 icon: "fa-water",            svgIcon: "wldpanel", shape: "wldpanel", color: "#0e7490", category: "Power",           power: "N/A",     defaultDimensions: { lengthMm: 600,  widthMm: 600,  heightMm: 2000 } },
  // ── Power distribution chain (drawn as real equipment, not generic boxes) ──
  // Ordered the way power actually flows through a datacenter:
  //   Transformer → Generator → MPP → PP → UPS → PDU → Rack
  // Each of these carries `svgIcon`, which makes the Toolbox tile render the
  // matching inline SVG from PowerChainIcons.jsx instead of a flat Font
  // Awesome glyph, and `shape`, which Datacenter3dview.jsx reads to build the
  // correct procedural 3D model when the tile is dropped onto the floor.
  { name: "Transformer",            icon: "fa-bolt",              svgIcon: "transformer", shape: "transformer", color: "#8b5cf6", category: "Power",   power: "500-2500kVA", defaultDimensions: { lengthMm: 2400, widthMm: 1600, heightMm: 2400 } },
  { name: "Busway",                 icon: "fa-grip-lines",        svgIcon: "busway",      shape: "busway",      color: "#eab308", category: "Power",   power: "400-5000A",   defaultDimensions: { lengthMm: 6000, widthMm: 400,  heightMm: 2800 } },
  { name: "Generator",              icon: "fa-gears",             svgIcon: "generator",   shape: "generator",   color: "#f97316", category: "Power",   power: "250-2000kVA", defaultDimensions: { lengthMm: 4200, widthMm: 1600, heightMm: 2200 } },
  { name: "MPP (Main Power Panel)", icon: "fa-table-columns",     svgIcon: "mpp",         shape: "mpp",         color: "#6366f1", category: "Power",   power: "630-4000A",   defaultDimensions: { lengthMm: 2400, widthMm: 800,  heightMm: 2200 } },
  { name: "PP (Power Panel)",       icon: "fa-table-cells-large", svgIcon: "pp",          shape: "pp",          color: "#0ea5e9", category: "Power",   power: "100-800A",    defaultDimensions: { lengthMm: 900,  widthMm: 600,  heightMm: 2000 } },
  { name: "UPS Module",             icon: "fa-car-battery",       svgIcon: "ups",         shape: "ups",         color: "#f59e0b", category: "Power",   power: "20-500kVA",   defaultDimensions: { lengthMm: 1200, widthMm: 850,  heightMm: 1950 } },
  { name: "PDU Cabinet",            icon: "fa-plug",              svgIcon: "pdu",         shape: "pdu",         color: "#14b8a6", category: "Power",   power: "100-400A",    defaultDimensions: { lengthMm: 1000, widthMm: 800,  heightMm: 1900 } },
  { name: "Rack",                   icon: "fa-server",            svgIcon: "rack",        shape: "rack",        color: "#3b82f6", category: "Compute", power: "3-15kW",      defaultDimensions: { lengthMm: 600,  widthMm: 1000, heightMm: 2000 } },
  // ── Network room: the Tier III deployment chain ─────────────────────────
  // Ordered exactly the way traffic actually flows through a datacenter:
  //   Internet/WAN → ISP Uplink (A/B) → Core Router (A/B) → Firewall (A/B) →
  //   Distribution Switch (A/B) → Access Switch / ToR (A/B) → Server racks
  // Every active stage is placed twice (an A side and a B side) so any one
  // box can be taken out for maintenance without dropping production traffic
  // — that is what "concurrently maintainable" means in the Uptime spec.
  // deploymentChains.js reads the `shape` key below to work out which stage a
  // placed device belongs to, what should have come before it, and what the
  // failure simulation is allowed to knock offline downstream of it.
  { name: "Internet / WAN",          icon: "fa-globe",            svgIcon: "wan",           shape: "wan",           color: "#0ea5e9", category: "Network", power: "N/A",       defaultDimensions: { lengthMm: 800,  widthMm: 800,  heightMm: 1800 } },
  { name: "ISP Uplink",              icon: "fa-tower-broadcast",  svgIcon: "isplink",       shape: "isplink",       color: "#0284c7", category: "Network", power: "50-150W",   defaultDimensions: { lengthMm: 600,  widthMm: 600,  heightMm: 1200 } },
  { name: "Fiber ODF",               icon: "fa-circle-nodes",     svgIcon: "odf",           shape: "odf",           color: "#06b6d4", category: "Network", power: "N/A",       defaultDimensions: { lengthMm: 600,  widthMm: 400,  heightMm: 1800 } },
  { name: "Patch Panel",             icon: "fa-ethernet",         svgIcon: "patchpanel",    shape: "patchpanel",    color: "#64748b", category: "Network", power: "N/A",       defaultDimensions: { lengthMm: 600,  widthMm: 300,  heightMm: 1800 } },
  { name: "Core Router",             icon: "fa-route",            svgIcon: "corerouter",    shape: "corerouter",    color: "#ef4444", category: "Network", power: "300-1500W", defaultDimensions: { lengthMm: 600,  widthMm: 1000, heightMm: 1600 } },
  { name: "IDS / IPS",               icon: "fa-shield-virus",     svgIcon: "idsips",        shape: "idsips",        color: "#f43f5e", category: "Network", power: "150-500W",  defaultDimensions: { lengthMm: 600,  widthMm: 1000, heightMm: 1400 } },
  { name: "Load Balancer",           icon: "fa-scale-balanced",   svgIcon: "loadbalancer",  shape: "loadbalancer",  color: "#0d9488", category: "Network", power: "150-500W",  defaultDimensions: { lengthMm: 600,  widthMm: 1000, heightMm: 1400 } },
  { name: "Distribution Switch",     icon: "fa-diagram-project",  svgIcon: "distswitch",    shape: "distswitch",    color: "#8b5cf6", category: "Network", power: "200-800W",  defaultDimensions: { lengthMm: 600,  widthMm: 1000, heightMm: 1600 } },
  { name: "Access Switch (ToR)",     icon: "fa-network-wired",    svgIcon: "torswitch",     shape: "torswitch",     color: "#6366f1", category: "Network", power: "100-400W",  defaultDimensions: { lengthMm: 600,  widthMm: 1000, heightMm: 1200 } },
  { name: "Console / OOB Server",    icon: "fa-terminal",         svgIcon: "consoleserver", shape: "consoleserver", color: "#84cc16", category: "Network", power: "40-120W",   defaultDimensions: { lengthMm: 600,  widthMm: 800,  heightMm: 1100 } },
  { name: "Network Rack",            icon: "fa-server",           svgIcon: "netrack",       shape: "netrack",       color: "#4f46e5", category: "Network", power: "1-5kW",     defaultDimensions: { lengthMm: 600,  widthMm: 1000, heightMm: 2000 } },
];

export const CATEGORY_COLORS = {
  Compute: "#3498db", Cooling: "#2ecc71", Power: "#f39c12",
  Network: "#9b59b6", Security: "#e74c3c", Storage: "#34495e",
  Safety: "#e67e22",  Environment: "#1abc9c",
  Floor: "#94a3b8",   Infrastructure: "#92400e",
};

export const ROOM_TYPES = [
  { value: "server",     label: "Server Room",     color: "#3498db", icon: "server"        },
  { value: "ac",         label: "AC Unit Room",    color: "#2ecc71", icon: "snowflake"     },
  { value: "dg",         label: "DG Set Room",     color: "#e67e22", icon: "bolt"          },
  { value: "electrical", label: "Electrical Room", color: "#f39c12", icon: "plug"          },
  { value: "network",    label: "Network Room",    color: "#9b59b6", icon: "network-wired" },
  { value: "storage",    label: "Storage Room",    color: "#34495e", icon: "hdd"           },
  { value: "ups",        label: "UPS Room",        color: "#1abc9c", icon: "car-battery"   },
  { value: "chiller",    label: "Chiller Room",    color: "#16a085", icon: "fan"           },
  { value: "corridor",   label: "Corridor",        color: "#64748b", icon: "road"          },
  { value: "custom",     label: "Custom Room",     color: "#95a5a6", icon: "door-open"     },
];

// Options rendered inside the Add Room modal's <select> (kept separate from
// ROOM_TYPES so each option can carry its own emoji glyph for the native
// dropdown, same pattern the file already used).
const ADD_ROOM_TYPE_OPTIONS = [
  { value: "server",     label: "Server Room",     icon: "🖥️" },
  { value: "ac",         label: "AC Unit Room",    icon: "❄️" },
  { value: "dg",         label: "DG Set Room",     icon: "⚡" },
  { value: "electrical", label: "Electrical Room", icon: "🔌" },
  { value: "network",    label: "Network Room",    icon: "🌐" },
  { value: "storage",    label: "Storage Room",    icon: "💾" },
  { value: "ups",        label: "UPS Room",        icon: "🔋" },
  { value: "chiller",    label: "Chiller Room",    icon: "🌀" },
  { value: "corridor",   label: "Corridor",        icon: "🚶" },
  { value: "custom",     label: "Custom Room",     icon: "🚪" },
];

export const dcimBus = {
  emit(event, data) {
    window.dispatchEvent(new CustomEvent(`dcim:${event}`, { detail: data }));
  },
  on(event, handler) {
    window.addEventListener(`dcim:${event}`, handler);
    return () => window.removeEventListener(`dcim:${event}`, handler);
  },
};

let globalDragActive = false;

export const useFontAwesome = () => {
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
    onDragEnd() {
      window.dispatchEvent(new CustomEvent("dcim:dragEnd"));
      if (elRef?.current) {
        elRef.current.style.opacity = "1";
        elRef.current.style.transform = "scale(1)";
      }
      // Keep the "we just dragged" flag set for a beat after dragend.
      // Some browsers (esp. after a fast/short drag) still fire a trailing
      // "click" on the source tile once the drop is over; without this
      // delay that stray click also fired the click-to-place flow below,
      // arming a second placement session and popping the Footprint modal
      // open a second time right after drag-and-drop had already placed
      // the device.
      setTimeout(() => { globalDragActive = false; }, 300);
    },
  };
}

const DeviceTileLarge = ({ dt }) => {
  const ref = useRef(null);
  const { onDragStart, onDragEnd } = buildDragHandlers({ ...dt, targetRoomId: null }, ref);
  // Click-to-place (product spec §19): a plain click (not a drag) starts a
  // placement session in the 3D viewer — a ghost follows the cursor until
  // the user clicks the floor. Useful when the Toolbox panel is parked
  // somewhere inconvenient for dragging.
  const onClick = () => {
    if (globalDragActive) return; // ignore a stray click right after a drag-and-drop
    dcimBus.emit("placeDeviceClick", { ...dt, targetRoomId: null });
  };
  return (
    <Tooltip title={`${dt.name} · ${dt.power} · Drag onto the floor, or click to place`} placement="top" mouseEnterDelay={0.2}>
      <div ref={ref} draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={onClick}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "10px 4px 8px", borderRadius: 10, background: `${dt.color}0e`, border: `1.5px solid ${dt.color}22`, cursor: "grab", transition: "all 0.15s ease", userSelect: "none" }}
        onMouseEnter={e => { e.currentTarget.style.background = `${dt.color}20`; e.currentTarget.style.border = `1.5px solid ${dt.color}60`; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 16px ${dt.color}28`; }}
        onMouseLeave={e => { e.currentTarget.style.background = `${dt.color}0e`; e.currentTarget.style.border = `1.5px solid ${dt.color}22`; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
      >
        <div style={{ width: 42, height: 42, borderRadius: 11, background: `${dt.color}18`, border: `1px solid ${dt.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {dt.svgIcon
            ? <DeviceIcon type={dt.svgIcon} size={30} color={dt.color} />
            : <i className={`fas ${dt.icon}`} style={{ color: dt.color, fontSize: 19, pointerEvents: "none" }} />}
        </div>
        <span style={{ fontSize: 9.5, fontWeight: 600, color: "#374151", textAlign: "center", lineHeight: 1.3, maxWidth: 72, wordBreak: "break-word" }}>{dt.name}</span>
      </div>
    </Tooltip>
  );
};

const DeviceTileSmall = ({ dt, roomId }) => {
  const ref = useRef(null);
  const { onDragStart, onDragEnd } = buildDragHandlers({ ...dt, targetRoomId: roomId }, ref);
  const onClick = () => {
    if (globalDragActive) return; // ignore a stray click right after a drag-and-drop
    dcimBus.emit("placeDeviceClick", { ...dt, targetRoomId: roomId });
  };
  return (
    <Tooltip title={`${dt.name} · ${dt.power} · Drag onto the floor, or click to place`} placement="top" mouseEnterDelay={0.2}>
      <div ref={ref} draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={onClick}
        style={{ width: 36, height: 36, borderRadius: 8, background: `${dt.color}12`, border: `1.5px solid ${dt.color}28`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "grab", transition: "all 0.13s ease", flexShrink: 0 }}
        onMouseEnter={e => { e.currentTarget.style.background = `${dt.color}26`; e.currentTarget.style.border = `1.5px solid ${dt.color}70`; e.currentTarget.style.transform = "scale(1.1)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = `${dt.color}12`; e.currentTarget.style.border = `1.5px solid ${dt.color}28`; e.currentTarget.style.transform = "scale(1)"; }}
      >
        {dt.svgIcon
          ? <DeviceIcon type={dt.svgIcon} size={24} color={dt.color} />
          : <i className={`fas ${dt.icon}`} style={{ color: dt.color, fontSize: 14, pointerEvents: "none" }} />}
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

// Every room is created as a clean, empty room — no server-room-specific
// rack/PAC-unit fields or auto-generated placeholders. Devices are added
// afterward by dragging them from the Device Library into the 3D viewer,
// where their exact L×W dimensions are captured before placement.
const DEFAULT_NEW_ROOM = {
  name: "", type: "server", width: 20, length: 20, height: 8, kw: 0,
  dimUnit: "m",
  margins: { top: 0, bottom: 0, left: 0, right: 0, unit: "m" },
  innerMargins: { top: 0, bottom: 0, left: 0, right: 0 },
};

// ── Design Tools: switches how clicks/drags on the 3D canvas behave.
// "view"      — orbit / drag devices to reposition / right-click tiles (default)
// "drawRoom"  — click-drag anywhere on the floor to draw a new room's footprint
//               (pick "Corridor" as the type in the popup to make a corridor)
// "connect"   — click one device, then another, to run a cable between them
const MODES = [
  { value: "view",     label: "View",    icon: <AimOutlined />,   hint: "Orbit, move devices, right-click tiles." },
  { value: "drawRoom",  label: "Draw Room", icon: <EditOutlined />, hint: "Click-drag anywhere on the floor to sketch a room (pick 'Corridor' as its type to make a corridor), then name it." },
  { value: "connect",  label: "Connect", icon: <ApiOutlined />,   hint: "Click a device, then another, to run a straight cable between them." },
];

const Toolbox = ({
  open, onClose, anchorX = 12, rooms = [], onAddRoom, onDeleteRoom, onViewRoom,
  mode = "view", onSetMode,
}) => {
  useFontAwesome();

  const [searchTerm,     setSearchTerm    ] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [expandedRoom,   setExpandedRoom  ] = useState(null);
  const [showAddModal,   setShowAddModal  ] = useState(false);
  const [newRoom, setNewRoom] = useState({ ...DEFAULT_NEW_ROOM });
  const [isDragging,     setIsDragging    ] = useState(false);
  const [deleteConfirm,  setDeleteConfirm ] = useState({ open: false, roomId: null, roomName: "" });

  const [panelPos, setPanelPos] = useState({ x: anchorX + 12, y: 60 });
  const [isMinimized, setIsMinimized] = useState(false);

  const draggingPanel = useRef(false);
  const dragOffset    = useRef({ x: 0, y: 0 });
  const panelRef      = useRef(null);

  useEffect(() => { setPanelPos(prev => ({ ...prev, x: anchorX + 12 })); }, [anchorX]);

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
    // Convert whatever unit the user picked (mm/cm/m/ft/in) into canonical
    // meters right here, once — the 3D view always expects meters and never
    // looks at dimUnit for math, only for display.
    const dimFactor = DIM_UNIT_TO_METERS[newRoom.dimUnit] ?? 1;
    // The room's LOOK comes from its type, and it has to be resolved here.
    // The modal only ever collected a `type` string, so a room created this
    // way carried no icon and no colour at all: the list rendered
    // `fas fa-undefined` (a blank tile) and every colour expression fell
    // back to an invalid string. The draw-a-room path already did this
    // lookup; only the "Add Room (exact size)" path was missing it.
    const typeInfo = ROOM_TYPES.find((t) => t.value === newRoom.type)
      || ROOM_TYPES.find((t) => t.value === "custom");
    const payload = {
      ...newRoom,
      typeLabel: typeInfo.label,
      color: typeInfo.color,
      hex: typeInfo.color,
      icon: typeInfo.icon,
      width: Number((newRoom.width * dimFactor).toFixed(3)),
      length: Number((newRoom.length * dimFactor).toFixed(3)),
      height: Number((newRoom.height * dimFactor).toFixed(3)),
      dimUnit: "m",
      innerMargins: { ...newRoom.innerMargins },
    };
    // onAddRoom returns false when the parent rejects the room (e.g. it
    // would be bigger than the floor's buildable area) — keep the modal
    // open with the entered values so the user can adjust and retry,
    // instead of silently closing as if it had been created.
    const ok = onAddRoom?.(payload);
    if (ok === false) return;
    setNewRoom({ ...DEFAULT_NEW_ROOM });
    setShowAddModal(false);
  };

  const handleDeleteClick = (e, room) => { e.stopPropagation(); setDeleteConfirm({ open: true, roomId: room.id, roomName: room.name }); };
  const confirmDelete = () => { onDeleteRoom?.(deleteConfirm.roomId); setExpandedRoom(prev => prev === deleteConfirm.roomId ? null : prev); setDeleteConfirm({ open: false, roomId: null, roomName: "" }); };
  const cancelDelete  = () => setDeleteConfirm({ open: false, roomId: null, roomName: "" });
  const closeAddModal = () => { setShowAddModal(false); setNewRoom({ ...DEFAULT_NEW_ROOM }); };

  if (!open) return null;

  const activeModeInfo = MODES.find(m => m.value === mode) || MODES[0];

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
                <div style={{ fontSize: 10, color: "#64748b" }}>{rooms.length} rooms · {DEVICE_TYPES.length} devices</div>
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

            {/* ── Design Tools ── */}
            {onSetMode && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>Design Tools</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                  {MODES.map(m => {
                    const active = mode === m.value;
                    return (
                      <Tooltip key={m.value} title={m.hint}>
                        <button onClick={() => onSetMode(m.value)}
                          style={{
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                            padding: "9px 4px", borderRadius: 9, cursor: "pointer",
                            border: active ? "1.5px solid #2563eb" : "1.5px solid #e2e8f0",
                            background: active ? "linear-gradient(135deg,#3b82f6,#1d4ed8)" : "#fff",
                            color: active ? "#fff" : "#475569",
                            fontSize: 10.5, fontWeight: 700, transition: "all 0.15s",
                            boxShadow: active ? "0 4px 12px rgba(37,99,235,0.35)" : "none",
                          }}>
                          <span style={{ fontSize: 15 }}>{m.icon}</span>
                          {m.label}
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>
                <div style={{ marginTop: 7, fontSize: 10, color: "#64748b", lineHeight: 1.4, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 7, padding: "6px 8px" }}>
                  <i className="fas fa-info-circle" style={{ marginRight: 4 }} />{activeModeInfo.hint}
                </div>
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.8px" }}>Rooms</span>
                <button onClick={() => setShowAddModal(true)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 6, background: "#f0f9ff", border: "1px solid #bae6fd", color: "#0284c7", fontSize: 10, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#e0f2fe"; }} onMouseLeave={e => { e.currentTarget.style.background = "#f0f9ff"; }}>
                  <PlusOutlined style={{ fontSize: 9 }} /> Add Room (exact size)
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {rooms.map(room => {
                  // Rooms created before the fix above (and any that arrive
                  // from an API without styling) have no icon/colour, so
                  // fall back to their type's rather than rendering
                  // `fa-undefined` and an invalid colour.
                  const rt = ROOM_TYPES.find((t) => t.value === room.type)
                    || ROOM_TYPES.find((t) => t.value === "custom");
                  const c = room.hex || room.color || rt.color;
                  const rawIcon = room.icon || rt.icon;
                  const iconCls = rawIcon.startsWith("fa-") ? rawIcon : `fa-${rawIcon}`;
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
                          <div style={{ fontSize: 9.5, color: "#94a3b8", marginTop: 1 }}>
                            {room.width}{room.dimUnit || "m"} × {room.length}{room.dimUnit || "m"} × {room.height}{room.dimUnit || "m"}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
                          <Tooltip title="View in 3D Viewer">
                            <div onClick={e => { e.stopPropagation(); onViewRoom?.(room.id); }} style={{ width: 27, height: 27, borderRadius: 7, background: "#f0fdf4", border: "1px solid #86efac", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}
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

      {/* Add Room Modal — every room is now created as a clean, empty room */}
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
              <div style={{ marginBottom: 16, marginTop: 16 }}>
                <label style={{ fontSize: 12, color: "#475569", marginBottom: 4, display: "block" }}>Room Type</label>
                <select value={newRoom.type} onChange={e => setNewRoom({ ...newRoom, type: e.target.value })}
                  style={{ width: "100%", padding: "5px 8px", borderRadius: 6, border: "1px solid #d9d9d9", fontSize: 13, outline: "none", background: "#fff", color: "#1e293b", boxSizing: "border-box", cursor: "pointer" }}>
                  {ADD_ROOM_TYPE_OPTIONS.map(rt => (
                    <option key={rt.value} value={rt.value}>{rt.icon} {rt.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 16, padding: 10, borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.4 }}>
                  <i className="fas fa-info-circle" style={{ marginRight: 4 }} />
                  Rooms are created empty. Once added, drag devices from the Device Library into the 3D viewer — you'll be asked for each device's exact footprint (L × W in mm) before it's placed. Prefer to just sketch a room freehand (including a corridor)? Use the <b>Draw Room</b> tool instead of this form.
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: "#475569", marginBottom: 4, display: "block" }}>Power Load (kW) <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span></label>
                <input type="number" min={0} value={newRoom.kw} onChange={e => setNewRoom({ ...newRoom, kw: parseFloat(e.target.value) || 0 })} placeholder="e.g., 500"
                  style={{ width: "100%", padding: "5px 10px", borderRadius: 6, border: "1px solid #d9d9d9", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: "#475569", marginBottom: 6, display: "block", fontWeight: 600 }}>
                Room Margin <span style={{ color: "#94a3b8", fontWeight: 400 }}>(space around this room)</span>
              </label>
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 11, color: "#64748b", marginBottom: 4, display: "block" }}>Margin Unit</label>
                <select value={newRoom.margins.unit} onChange={e => setNewRoom({ ...newRoom, margins: { ...newRoom.margins, unit: e.target.value } })}
                  style={{ width: "100%", padding: "5px 8px", borderRadius: 6, border: "1px solid #d9d9d9", fontSize: 13, outline: "none", background: "#fff", color: "#1e293b", boxSizing: "border-box", cursor: "pointer" }}>
                  {ROOM_MARGIN_UNITS.map(u => (<option key={u.value} value={u.value}>{u.label}</option>))}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                {["top", "bottom", "left", "right"].map(side => (
                  <div key={side}>
                    <label style={{ fontSize: 10, color: "#64748b", marginBottom: 3, display: "block", textTransform: "capitalize" }}>{side}</label>
                    <input type="number" min={0} value={newRoom.margins[side]}
                      onChange={e => setNewRoom({ ...newRoom, margins: { ...newRoom.margins, [side]: parseFloat(e.target.value) || 0 } })}
                      placeholder="0" style={{ width: "100%", padding: "5px 8px", borderRadius: 6, border: "1px solid #d9d9d9", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: "#475569", marginBottom: 6, display: "block", fontWeight: 600 }}>
                Internal Margin <span style={{ color: "#94a3b8", fontWeight: 400 }}>(inside room, near walls)</span>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                {["top", "bottom", "left", "right"].map(side => (
                  <div key={side}>
                    <label style={{ fontSize: 10, color: "#64748b", marginBottom: 3, display: "block", textTransform: "capitalize" }}>{side}</label>
                    <input type="number" min={0} value={newRoom.innerMargins[side]}
                      onChange={e => setNewRoom({ ...newRoom, innerMargins: { ...newRoom.innerMargins, [side]: parseFloat(e.target.value) || 0 } })}
                      placeholder="0" style={{ width: "100%", padding: "5px 8px", borderRadius: 6, border: "1px solid #d9d9d9", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "#475569", marginBottom: 4, display: "block" }}>Dimension Unit</label>
              <select value={newRoom.dimUnit} onChange={e => setNewRoom({ ...newRoom, dimUnit: e.target.value })}
                style={{ width: "100%", padding: "5px 8px", borderRadius: 6, border: "1px solid #d9d9d9", fontSize: 13, outline: "none", background: "#fff", color: "#1e293b", boxSizing: "border-box", cursor: "pointer" }}>
                {ROOM_MARGIN_UNITS.map(u => (<option key={u.value} value={u.value}>{u.label}</option>))}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 24 }}>
              {[["Width", "width"], ["Length", "length"], ["Height", "height"]].map(([lbl, key]) => (
                <div key={key}>
                  <label style={{ fontSize: 12, color: "#475569", marginBottom: 4, display: "block" }}>{lbl} ({newRoom.dimUnit})</label>
                  <Input type="number" size="small" min={0.1} value={newRoom[key]} onChange={e => setNewRoom({ ...newRoom, [key]: parseFloat(e.target.value) || 0 })} />
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
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", backgroundColor: "white", padding: "24px", borderRadius: "8px", width: "400px", maxWidth: "95%", zIndex: 100003, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", textAlign: "center" }}>
            <div style={{ marginBottom: "16px" }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                <DeleteOutlined style={{ fontSize: "28px", color: "#ef4444" }} />
              </div>
            </div>
            <h2 style={{ color: "#ef4444", marginBottom: "8px", fontSize: "20px" }}>Delete Room</h2>
            <p style={{ fontSize: "14px", marginBottom: "16px", color: "#374151" }}>Are you sure you want to delete <strong>"{deleteConfirm.roomName}"</strong>?</p>
            <p style={{ margin: "0 0 20px 0", fontSize: "12px", color: "#94a3b8" }}>This action cannot be undone.</p>
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

export default Toolbox;