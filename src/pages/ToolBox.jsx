import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────────────────────
// DATA (copied from DCIMViewer)
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_ROOMS = [
  { id: 0, name: "Server Room",  icon: "fa-server",    color: 0x3498db, hex: "#3498db", width: 20, length: 20, height: 8 },
  { id: 1, name: "AC Unit Room", icon: "fa-snowflake", color: 0x2ecc71, hex: "#2ecc71", width: 20, length: 20, height: 8 },
  { id: 2, name: "DG Set Room",  icon: "fa-bolt",      color: 0xe67e22, hex: "#e67e22", width: 20, length: 20, height: 8 },
];

const DEVICE_TYPES = [
  { name: "Server Rack",    icon: "fa-server",            color: "#3498db", category: "Compute",     power: "1-5kW",     description: "Rack-mounted servers for data processing" },
  { name: "Blade Server",   icon: "fa-sitemap",           color: "#2980b9", category: "Compute",     power: "0.5-2kW",   description: "High-density blade servers" },
  { name: "AC Unit",        icon: "fa-snowflake",         color: "#2ecc71", category: "Cooling",     power: "5-20kW",    description: "Air conditioning units for cooling" },
  { name: "Chiller",        icon: "fa-fan",               color: "#16a085", category: "Cooling",     power: "10-100kW",  description: "Central chiller units" },
  { name: "CRAC Unit",      icon: "fa-temperature-low",   color: "#1abc9c", category: "Cooling",     power: "5-30kW",    description: "Computer room air conditioning" },
  { name: "DG Set",         icon: "fa-bolt",              color: "#e67e22", category: "Power",       power: "50-500kW",  description: "Diesel generator sets" },
  { name: "UPS",            icon: "fa-car-battery",       color: "#f39c12", category: "Power",       power: "1-100kVA",  description: "Uninterruptible power supply" },
  { name: "PDU",            icon: "fa-plug",              color: "#1abc9c", category: "Power",       power: "10-100A",   description: "Power distribution units" },
  { name: "Network Switch", icon: "fa-network-wired",     color: "#9b59b6", category: "Network",     power: "100-500W",  description: "Ethernet network switches" },
  { name: "Router",         icon: "fa-route",             color: "#e74c3c", category: "Network",     power: "50-300W",   description: "Network routing equipment" },
  { name: "Firewall",       icon: "fa-shield-alt",        color: "#c0392b", category: "Security",    power: "100-400W",  description: "Network security firewall" },
  { name: "Storage Array",  icon: "fa-hdd",               color: "#34495e", category: "Storage",     power: "1-10kW",    description: "Enterprise storage arrays" },
  { name: "KVM Switch",     icon: "fa-desktop",           color: "#d35400", category: "Management",  power: "50-200W",   description: "Keyboard-video-mouse switch" },
  { name: "CCTV Camera",    icon: "fa-video",             color: "#8e44ad", category: "Security",    power: "20-50W",    description: "Security surveillance camera" },
  { name: "VESDA System",   icon: "fa-fire-extinguisher", color: "#e74c3c", category: "Safety",      power: "100-300W",  description: "Very early smoke detection" },
  { name: "FM200 System",   icon: "fa-fire",              color: "#f39c12", category: "Safety",      power: "200-500W",  description: "Fire suppression system" },
  { name: "Humidifier",     icon: "fa-tint",              color: "#3498db", category: "Environment", power: "0.5-5kW",   description: "Humidity control system" },
];

const DEFAULT_PARAMS = {
  "Server Rack":    { model: "Server Model X",  power: "850W"  },
  "Blade Server":   { model: "Blade Server B",  power: "650W"  },
  "AC Unit":        { model: "AC Model Y",       power: "550W"  },
  "Chiller":        { model: "Chiller C",        power: "400W"  },
  "CRAC Unit":      { model: "CRAC CR",          power: "18kW"  },
  "DG Set":         { model: "DG Model Z",       power: "25kW"  },
  "UPS":            { model: "UPS U",            power: "250W"  },
  "PDU":            { model: "PDU P",            power: "130W"  },
  "Network Switch": { model: "Switch S",         power: "175W"  },
  "Router":         { model: "Router R",         power: "160W"  },
  "Firewall":       { model: "Firewall F",       power: "240W"  },
  "Storage Array":  { model: "Storage S",        power: "500W"  },
  "KVM Switch":     { model: "KVM K",            power: "100W"  },
  "CCTV Camera":    { model: "Camera CC",        power: "25W"   },
  "VESDA System":   { model: "VESDA V",          power: "200W"  },
  "FM200 System":   { model: "FM200 FM",         power: "350W"  },
  "Humidifier":     { model: "Humidifier H",     power: "2kW"   },
};

const categoryColors = {
  Compute: "#3498db", Cooling: "#2ecc71", Power: "#f39c12",
  Network: "#9b59b6", Security: "#e74c3c", Storage: "#34495e",
  Management: "#27ae60", Safety: "#e67e22", Environment: "#1abc9c",
};

// ─────────────────────────────────────────────────────────────────────────────
// DEVICE CARD COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const DeviceCard = ({ dt, onDragStart, onDoubleClick, size = "md" }) => (
  <div
    onPointerDown={onDragStart ? (e) => { e.stopPropagation(); onDragStart(e, dt.name); } : undefined}
    onDoubleClick={onDoubleClick ? () => onDoubleClick(dt.name) : undefined}
    title={dt.description}
    style={{
      background: "linear-gradient(145deg,#fff,#f6f8fb)",
      border: `2px solid ${dt.color}22`,
      borderLeft: `3px solid ${dt.color}`,
      borderRadius: 8,
      padding: size === "sm" ? "8px 6px" : "11px 8px",
      display: "flex", flexDirection: "column", alignItems: "center",
      cursor: onDragStart ? "grab" : "default",
      userSelect: "none",
      transition: "all 0.18s ease",
      boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
      minHeight: size === "sm" ? 68 : 82,
      justifyContent: "center",
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 18px ${dt.color}33`; }}
    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.06)"; }}
  >
    <i className={`fas ${dt.icon}`} style={{ color: dt.color, fontSize: size === "sm" ? 16 : 20, marginBottom: 5 }}></i>
    <span style={{ fontSize: size === "sm" ? 9 : 10, textAlign: "center", color: "#2c3e50", fontWeight: 600, lineHeight: 1.3 }}>{dt.name}</span>
    <span style={{ fontSize: 8, color: "#95a5a6", marginTop: 3 }}>{dt.power}</span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN TOOLBOX COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function ToolBox() {
  const navigate = useNavigate();
  
  // State management
  const [rooms, setRooms] = useState(DEFAULT_ROOMS);
  const [expandedRooms, setExpandedRooms] = useState({});
  const [roomDeviceMap, setRoomDeviceMap] = useState({});
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [roomIdCounter, setRoomIdCounter] = useState(3);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showDeviceLibrary, setShowDeviceLibrary] = useState(false);
  
  // New room form state
  const [newRoom, setNewRoom] = useState({
    name: "",
    width: 20,
    length: 20,
    height: 8
  });

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Notify helper
  const notify = (msg, type = "info") => {
    const id = Date.now();
    setNotifications(n => [...n, { id, msg, type }]);
    setTimeout(() => setNotifications(n => n.filter(x => x.id !== id)), 3000);
  };

  // Group devices by category
  const devicesByCategory = DEVICE_TYPES.reduce((acc, d) => {
    if (!acc[d.category]) acc[d.category] = [];
    acc[d.category].push(d);
    return acc;
  }, {});

  // Get unique categories
  const categories = ["All", ...Object.keys(devicesByCategory)];

  // Filter devices based on search and category
  const filteredDevices = DEVICE_TYPES.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "All" || device.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Add new room
  const addRoom = () => {
    if (!newRoom.name.trim()) {
      notify("Please enter a room name", "error");
      return;
    }
    
    const palettes = [
      [0x9b59b6, "#9b59b6"],
      [0xe74c3c, "#e74c3c"],
      [0x1abc9c, "#1abc9c"],
      [0xf39c12, "#f39c12"],
      [0x3498db, "#3498db"],
      [0x2ecc71, "#2ecc71"]
    ];
    
    const [color, hex] = palettes[roomIdCounter % palettes.length];
    
    const room = {
      id: roomIdCounter,
      name: newRoom.name,
      color,
      hex,
      width: newRoom.width,
      length: newRoom.length,
      height: newRoom.height,
      icon: "fa-door-open",
      custom: true
    };
    
    setRooms(prev => [...prev, room]);
    setRoomDeviceMap(prev => ({ ...prev, [room.id]: [] }));
    setRoomIdCounter(prev => prev + 1);
    setShowAddRoomModal(false);
    setNewRoom({ name: "", width: 20, length: 20, height: 8 });
    notify(`Room "${room.name}" added successfully`, "success");
  };

  // Delete room
  const deleteRoom = (roomId) => {
    if (!window.confirm("Delete this room and all devices?")) return;
    setRooms(prev => prev.filter(r => r.id !== roomId));
    const newMap = { ...roomDeviceMap };
    delete newMap[roomId];
    setRoomDeviceMap(newMap);
    notify("Room deleted", "success");
  };

  // Add device to room
  const addDeviceToRoom = (roomId, deviceTypeName) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    
    const dtype = DEVICE_TYPES.find(d => d.name === deviceTypeName);
    const params = DEFAULT_PARAMS[deviceTypeName] || {};
    
    const device = {
      id: "DEV-" + String(Date.now()).slice(-6) + "-" + Math.floor(Math.random() * 1000),
      name: deviceTypeName,
      category: deviceTypeName,
      model: (params.model || deviceTypeName) + "-" + Math.floor(Math.random() * 999),
      power: params.power || "200W",
      status: ["Operational", "Warning", "Maintenance"][Math.floor(Math.random() * 3)],
      temperature: (22 + Math.floor(Math.random() * 8)) + "°C",
      uptime: (95 + Math.floor(Math.random() * 5)) + "%",
      capacity: (65 + Math.floor(Math.random() * 30)) + "%",
      location: room.name,
      description: dtype?.description || "Data center device.",
      color: dtype?.color || "#3498db",
    };
    
    setRoomDeviceMap(prev => ({
      ...prev,
      [roomId]: [...(prev[roomId] || []), device]
    }));
    
    notify(`${deviceTypeName} added to ${room.name}`, "success");
  };

  // Remove device from room
  const removeDeviceFromRoom = (roomId, deviceId) => {
    setRoomDeviceMap(prev => ({
      ...prev,
      [roomId]: prev[roomId].filter(d => d.id !== deviceId)
    }));
    notify("Device removed", "success");
  };

  // Toggle room expansion
  const toggleRoom = (roomId) => {
    setExpandedRooms(prev => ({ ...prev, [roomId]: !prev[roomId] }));
  };

  // Navigate to DCIM Viewer with room context
  const viewInDCIM = (roomId) => {
    navigate(`/dcim-viewer?room=${roomId}`);
  };

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <style>{`
        @keyframes fadeUp { from { opacity:0;transform:translateY(10px); } to { opacity:1;transform:translateY(0); } }
        @keyframes slideDown { from { opacity:0;transform:translateY(-6px); } to { opacity:1;transform:translateY(0); } }
        @keyframes pulse { 0% { opacity:1; } 50% { opacity:0.6; } 100% { opacity:1; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #c8d0da; border-radius: 4px; }
      `}</style>

      <div style={{ 
        padding: "24px",
        background: "#f0f4f8",
        minHeight: "100vh",
        fontFamily: "'Segoe UI',system-ui,sans-serif",
        color: "#2c3e50"
      }}>
        {/* Header */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: 24
        }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a3a5c", margin: 0 }}>
              <i className="fas fa-tools" style={{ color: "#3b82f6", marginRight: 12 }}></i>
              ToolBox - Room & Device Management
            </h1>
            <p style={{ color: "#5a6a7a", margin: "5px 0 0 42px", fontSize: 14 }}>
              Manage rooms and devices before adding them to the 3D viewer
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setShowDeviceLibrary(true)}
              style={{
                background: "linear-gradient(135deg,#3b82f6,#2563eb)",
                color: "#fff",
                border: "none",
                padding: "10px 18px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <i className="fas fa-microchip"></i>
              Device Library
            </button>
            <button
              onClick={() => setShowAddRoomModal(true)}
              style={{
                background: "linear-gradient(135deg,#10b981,#059669)",
                color: "#fff",
                border: "none",
                padding: "10px 18px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <i className="fas fa-plus-circle"></i>
              Add Room
            </button>
            <button
              onClick={() => navigate('/dcim-viewer')}
              style={{
                background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
                color: "#fff",
                border: "none",
                padding: "10px 18px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <i className="fas fa-cube"></i>
              Open 3D Viewer
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(4, 1fr)", 
          gap: 16,
          marginBottom: 24
        }}>
          {[
            { icon: "fa-building", label: "Total Rooms", value: rooms.length, color: "#3b82f6" },
            { icon: "fa-microchip", label: "Total Devices", value: Object.values(roomDeviceMap).flat().length, color: "#10b981" },
            { icon: "fa-server", label: "Device Types", value: DEVICE_TYPES.length, color: "#8b5cf6" },
            { icon: "fa-door-open", label: "Custom Rooms", value: rooms.filter(r => r.custom).length, color: "#f59e0b" },
          ].map(stat => (
            <div key={stat.label} style={{
              background: "#fff",
              borderRadius: 12,
              padding: "16px 20px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
              border: "1px solid #e5eaf2",
              display: "flex",
              alignItems: "center",
              gap: 14
            }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: `${stat.color}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <i className={`fas ${stat.icon}`} style={{ fontSize: 22, color: stat.color }}></i>
              </div>
              <div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>{stat.label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: "#1f2937", lineHeight: 1.2 }}>{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content - Two Columns */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Left Column - Rooms List */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.05)" }}>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: 16
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1a3a5c", margin: 0 }}>
                <i className="fas fa-building" style={{ color: "#3b82f6", marginRight: 8 }}></i>
                Rooms ({rooms.length})
              </h2>
              <button
                onClick={() => setShowAddRoomModal(true)}
                style={{
                  background: "#f0f7ff",
                  border: "1px solid #bfdbfe",
                  color: "#2563eb",
                  padding: "6px 12px",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 5
                }}
              >
                <i className="fas fa-plus"></i>
                Add Room
              </button>
            </div>

            {/* Rooms List */}
            <div style={{ maxHeight: 600, overflowY: "auto" }}>
              {rooms.map(room => {
                const devices = roomDeviceMap[room.id] || [];
                const isExpanded = expandedRooms[room.id];
                
                return (
                  <div key={room.id} style={{ 
                    marginBottom: 12,
                    border: "1px solid #e5eaf2",
                    borderRadius: 10,
                    overflow: "hidden"
                  }}>
                    {/* Room Header */}
                    <div
                      onClick={() => toggleRoom(room.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "14px 16px",
                        background: isExpanded ? `${room.hex}11` : "#fff",
                        cursor: "pointer",
                        borderBottom: isExpanded ? `1px solid ${room.hex}22` : "none",
                        transition: "all 0.2s"
                      }}
                    >
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: `${room.hex}22`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12
                      }}>
                        <i className={`fas ${room.icon}`} style={{ color: room.hex, fontSize: 18 }}></i>
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "#1a3a5c" }}>
                          {room.name}
                          {room.custom && (
                            <span style={{ 
                              marginLeft: 8, 
                              background: "#f0f7ff", 
                              fontSize: 10, 
                              padding: "2px 6px", 
                              borderRadius: 4,
                              color: "#3b82f6"
                            }}>
                              Custom
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                          {room.width}x{room.length}x{room.height}m • {devices.length} devices
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); viewInDCIM(room.id); }}
                          style={{
                            background: "rgba(59,130,246,0.1)",
                            border: "1px solid #93c5fd",
                            color: "#2563eb",
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                          title="View in 3D"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        
                        {room.custom && (
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteRoom(room.id); }}
                            style={{
                              background: "rgba(239,68,68,0.1)",
                              border: "1px solid #fecaca",
                              color: "#dc2626",
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                            title="Delete Room"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                        
                        <i className={`fas fa-chevron-${isExpanded ? "up" : "down"}`} style={{ 
                          fontSize: 12, 
                          color: "#94a3b8",
                          marginLeft: 4
                        }}></i>
                      </div>
                    </div>

                    {/* Expanded Content - Devices in Room */}
                    {isExpanded && (
                      <div style={{ padding: 16, background: "#fafbfc" }}>
                        {/* Device Count Info */}
                        <div style={{ 
                          display: "flex", 
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 12
                        }}>
                          <span style={{ fontSize: 12, color: "#4b5563" }}>
                            <i className="fas fa-microchip" style={{ marginRight: 4, color: "#9ca3af" }}></i>
                            {devices.length} devices in this room
                          </span>
                          
                          {/* Quick Add Dropdown */}
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                addDeviceToRoom(room.id, e.target.value);
                                e.target.value = "";
                              }
                            }}
                            value=""
                            style={{
                              padding: "6px 12px",
                              borderRadius: 6,
                              border: "1px solid #d1d5db",
                              fontSize: 12,
                              background: "#fff"
                            }}
                          >
                            <option value="">➕ Quick add device...</option>
                            {DEVICE_TYPES.map(dt => (
                              <option key={dt.name} value={dt.name}>
                                {dt.name} ({dt.power})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Devices Grid */}
                        {devices.length > 0 ? (
                          <div style={{ 
                            display: "grid", 
                            gridTemplateColumns: "repeat(2, 1fr)", 
                            gap: 8,
                            maxHeight: 300,
                            overflowY: "auto",
                            padding: "4px 0"
                          }}>
                            {devices.map(device => (
                              <div
                                key={device.id}
                                style={{
                                  background: "#fff",
                                  border: "1px solid #e5e7eb",
                                  borderRadius: 8,
                                  padding: 10,
                                  position: "relative"
                                }}
                              >
                                <button
                                  onClick={() => removeDeviceFromRoom(room.id, device.id)}
                                  style={{
                                    position: "absolute",
                                    top: 4,
                                    right: 4,
                                    background: "none",
                                    border: "none",
                                    color: "#9ca3af",
                                    cursor: "pointer",
                                    fontSize: 14
                                  }}
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <i className={`fas ${DEVICE_TYPES.find(d => d.name === device.category)?.icon || "fa-microchip"}`}
                                     style={{ color: device.color, fontSize: 16 }}></i>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: "#1f2937", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                      {device.name}
                                    </div>
                                    <div style={{ fontSize: 10, color: "#6b7280" }}>{device.model}</div>
                                  </div>
                                </div>
                                <div style={{ 
                                  display: "flex", 
                                  justifyContent: "space-between",
                                  marginTop: 6,
                                  fontSize: 9,
                                  color: "#6b7280"
                                }}>
                                  <span>{device.power}</span>
                                  <span style={{
                                    color: device.status === "Operational" ? "#10b981" :
                                           device.status === "Warning" ? "#f59e0b" : "#ef4444"
                                  }}>
                                    {device.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ 
                            textAlign: "center", 
                            padding: "24px 0",
                            background: "#f9fafb",
                            borderRadius: 8,
                            border: "1px dashed #d1d5db"
                          }}>
                            <i className="fas fa-box-open" style={{ fontSize: 24, color: "#9ca3af", marginBottom: 8 }}></i>
                            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>No devices in this room yet</p>
                            <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Add devices using the dropdown above</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column - Device Library Preview */}
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.05)" }}>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: 16
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1a3a5c", margin: 0 }}>
                <i className="fas fa-microchip" style={{ color: "#8b5cf6", marginRight: 8 }}></i>
                Device Library
              </h2>
              <button
                onClick={() => setShowDeviceLibrary(true)}
                style={{
                  background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
                  color: "#fff",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 5
                }}
              >
                <i className="fas fa-expand"></i>
                View All
              </button>
            </div>

            {/* Search and Filter */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <i className="fas fa-search" style={{ 
                    position: "absolute", 
                    left: 10, 
                    top: "50%", 
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                    fontSize: 12
                  }}></i>
                  <input
                    type="text"
                    placeholder="Search devices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 10px 10px 32px",
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      fontSize: 13,
                      outline: "none"
                    }}
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{
                    padding: "10px",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: 13,
                    background: "#fff",
                    minWidth: 120
                  }}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Device Grid */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(3, 1fr)", 
              gap: 10,
              maxHeight: 500,
              overflowY: "auto",
              padding: "4px 0"
            }}>
              {filteredDevices.map(dt => (
                <DeviceCard 
                  key={dt.name} 
                  dt={dt} 
                  size="sm"
                />
              ))}
            </div>

            {filteredDevices.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
                <i className="fas fa-search" style={{ fontSize: 32, marginBottom: 12 }}></i>
                <p>No devices match your search</p>
              </div>
            )}
          </div>
        </div>

        {/* Add Room Modal */}
        {showAddRoomModal && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,20,30,0.45)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9000
          }} onClick={() => setShowAddRoomModal(false)}>
            <div style={{
              background: "#fff",
              borderRadius: 18,
              padding: 28,
              width: "90%",
              maxWidth: 450,
              boxShadow: "0 24px 64px rgba(0,0,0,0.22)"
            }} onClick={e => e.stopPropagation()}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1a3a5c", display: "flex", alignItems: "center", gap: 10 }}>
                  <i className="fas fa-door-open" style={{ color: "#10b981" }}></i>
                  Add New Room
                </div>
                <button
                  onClick={() => setShowAddRoomModal(false)}
                  style={{
                    background: "rgba(231,76,60,0.1)",
                    border: "1px solid #e74c3c",
                    color: "#e74c3c",
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 17,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, color: "#4b5563", marginBottom: 6, display: "block" }}>
                  Room Name
                </label>
                <input
                  type="text"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                  placeholder="e.g., Server Room 2"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: 14,
                    outline: "none"
                  }}
                  autoFocus
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 13, color: "#4b5563", marginBottom: 6, display: "block" }}>
                    Width (m)
                  </label>
                  <input
                    type="number"
                    value={newRoom.width}
                    onChange={(e) => setNewRoom({ ...newRoom, width: parseInt(e.target.value) || 20 })}
                    min="5"
                    max="50"
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1px solid #e2e8f0",
                      fontSize: 13,
                      outline: "none"
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "#4b5563", marginBottom: 6, display: "block" }}>
                    Length (m)
                  </label>
                  <input
                    type="number"
                    value={newRoom.length}
                    onChange={(e) => setNewRoom({ ...newRoom, length: parseInt(e.target.value) || 20 })}
                    min="5"
                    max="50"
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1px solid #e2e8f0",
                      fontSize: 13,
                      outline: "none"
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "#4b5563", marginBottom: 6, display: "block" }}>
                    Height (m)
                  </label>
                  <input
                    type="number"
                    value={newRoom.height}
                    onChange={(e) => setNewRoom({ ...newRoom, height: parseInt(e.target.value) || 8 })}
                    min="2"
                    max="20"
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1px solid #e2e8f0",
                      fontSize: 13,
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              <div style={{ background: "#f0f9ff", padding: 12, borderRadius: 8, marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: "#0369a1", display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="fas fa-info-circle"></i>
                  <span>Room will be added with a unique color and can be managed in the 3D viewer</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={addRoom}
                  style={{
                    flex: 1,
                    background: "linear-gradient(135deg,#10b981,#059669)",
                    color: "#fff",
                    border: "none",
                    padding: "12px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600
                  }}
                >
                  Add Room
                </button>
                <button
                  onClick={() => setShowAddRoomModal(false)}
                  style={{
                    flex: 1,
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    padding: "12px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full Device Library Modal */}
        {showDeviceLibrary && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,20,30,0.45)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9000
          }} onClick={() => setShowDeviceLibrary(false)}>
            <div style={{
              background: "#fff",
              borderRadius: 18,
              padding: 28,
              width: "90%",
              maxWidth: 800,
              maxHeight: "88vh",
              overflowY: "auto",
              boxShadow: "0 24px 64px rgba(0,0,0,0.22)"
            }} onClick={e => e.stopPropagation()}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1a3a5c", display: "flex", alignItems: "center", gap: 10 }}>
                  <i className="fas fa-microchip" style={{ color: "#8b5cf6" }}></i>
                  Device Library
                </div>
                <button
                  onClick={() => setShowDeviceLibrary(false)}
                  style={{
                    background: "rgba(231,76,60,0.1)",
                    border: "1px solid #e74c3c",
                    color: "#e74c3c",
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 17,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ background: "#fef3c7", border: "1px solid #fbbf24", borderRadius: 8, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
                <i className="fas fa-lightbulb" style={{ color: "#f59e0b", marginTop: 2 }}></i>
                <span style={{ fontSize: 13, color: "#92400e" }}>
                  To add a device: Expand a room in the main view and use the dropdown, or go back to the 3D viewer and drag devices directly onto rooms.
                </span>
              </div>

              {Object.entries(devicesByCategory).map(([cat, devTypes]) => (
                <div key={cat} style={{ marginBottom: 24 }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: categoryColors[cat] || "#3b82f6",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 12,
                    paddingBottom: 5,
                    borderBottom: `2px solid ${categoryColors[cat]}33`
                  }}>
                    {cat} ({devTypes.length})
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
                    {devTypes.map(dt => (
                      <DeviceCard key={dt.name} dt={dt} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notifications */}
        <div style={{
          position: "fixed",
          bottom: 18,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: 7,
          zIndex: 9999,
          pointerEvents: "none"
        }}>
          {notifications.map(n => (
            <div key={n.id} style={{
              color: "#fff",
              padding: "9px 18px",
              borderRadius: 22,
              fontWeight: 600,
              fontSize: 12,
              boxShadow: "0 4px 18px rgba(0,0,0,0.15)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              animation: "fadeUp 0.3s ease",
              background: n.type === "success" ? "#27ae60" : n.type === "error" ? "#e74c3c" : "#2980b9"
            }}>
              <i className={`fas ${n.type === "success" ? "fa-check-circle" : "fa-info-circle"}`}></i>
              {n.msg}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}