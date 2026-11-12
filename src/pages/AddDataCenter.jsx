// // AddDataCenter.jsx  — with Length/Breadth fields + Eye → inline 5D view
// import React, { useState, useEffect } from "react";
// import {
//   Table, Row, Col, Typography, Space, Button, Select,
//   message, Input, Switch, Divider, Avatar, Tooltip, Badge,
//   InputNumber, Progress,
// } from "antd";
// import {
//   CloudServerOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
//   MailOutlined, PhoneOutlined, GlobalOutlined, EnvironmentOutlined,
//   CheckCircleOutlined, StopOutlined, PlusOutlined, SearchOutlined,
//   ExclamationCircleOutlined, CloseOutlined, EyeOutlined,
//   UserOutlined, ThunderboltOutlined, HeatMapOutlined, ApiOutlined,
//   DashboardOutlined,
// } from "@ant-design/icons";

// import DataCenter3DView, { dcimBus } from "./DataCenter3DView";

// const { Title, Text } = Typography;
// const { Option } = Select;

// // ── unit options ──────────────────────────────────────────────────────────
// const DIMENSION_UNITS = [
//   { value: "m",  label: "m"  },
//   { value: "mm", label: "mm" },
//   { value: "ft", label: "ft" },
//   { value: "yd", label: "yd" },
//   { value: "km", label: "km" },
// ];

// // ── Power unit options ──────────────────────────────────────────────────
// const POWER_UNITS = [
//   { value: "kW", label: "kW" },
//   { value: "MW", label: "MW" },
//   { value: "BTU/h", label: "BTU/h" },
//   { value: "Tons", label: "Tons (Refrigeration)" },
//   { value: "kVA", label: "kVA" },
//   { value: "HP", label: "HP" },
// ];

// // ── Margin unit options ──────────────────────────────────────────────────
// const MARGIN_UNITS = [
//   { value: "m", label: "Meters (m)" },
//   { value: "mm", label: "Millimeters (mm)" },
//   { value: "cm", label: "Centimeters (cm)" },
//   { value: "ft", label: "Feet (ft)" },
//   { value: "px", label: "Pixels (px)" },
//   { value: "%", label: "Percentage (%)" },
// ];


// const AddDataCenter = () => {
//   const [loading, setLoading]               = useState(false);
//   const [showModal, setShowModal]           = useState(false);
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [dcToDelete, setDcToDelete]         = useState(null);
//   const [editingDC, setEditingDC]           = useState(null);
//   const [show3DView, setShow3DView]         = useState(false);
//   const [viewing3DDC, setViewing3DDC]       = useState(null);
//   const [viewer3DTheme, setViewer3DTheme]   = useState("light");
//   const [sortedInfo, setSortedInfo]         = useState({ columnKey: "id", order: "ascend" });
//   const [searchText, setSearchText]         = useState("");
//   const [countryFilter, setCountryFilter]   = useState("all");
//   const [statusFilter, setStatusFilter]     = useState("all");
//   const [availableStates, setAvailableStates] = useState([]);
//   const [availableCities, setAvailableCities] = useState([]);
//   const [availableSites, setAvailableSites]   = useState([]);
//   const [dcRooms, setDcRooms]               = useState({}); // { [dcId]: room[] }

//   // ── Keep dcRooms in sync with Toolbox / 3D view drag-drop & add/delete room events ──
// useEffect(() => {
//   const genId = () => Date.now() + Math.floor(Math.random() * 1000);

//   const offAdd = dcimBus.on("addRoom", (e) => {
//     const room = e.detail;
//     if (!viewing3DDC) return; // no 3D view open, ignore
//     setDcRooms((prev) => {
//       const list = prev[viewing3DDC.id] || [];
//       const newRoom = {
//         id: room.id || genId(),
//         margins: { top: 1, bottom: 1, left: 1, right: 1 },
//         ...room,
//         color: room.hex || room.color || "#3498db",
//         typeLabel: room.typeLabel || room.type,
//       };
//       return { ...prev, [viewing3DDC.id]: [...list, newRoom] };
//     });
//   });

//   const offDelete = dcimBus.on("deleteRoom", (e) => {
//     const { id } = e.detail;
//     if (!viewing3DDC) return;
//     setDcRooms((prev) => ({
//       ...prev,
//       [viewing3DDC.id]: (prev[viewing3DDC.id] || []).filter((r) => r.id !== id),
//     }));
//   });

//   const offZoom = dcimBus.on("zoomRoom", (e) => {
//     // optional: hook up camera-focus logic here later if needed
//   });

//   return () => {
//     offAdd();
//     offDelete();
//     offZoom();
//   };
// }, [viewing3DDC]);

//   // ── Reference Data ────────────────────────────────────────────────────────
//   const tenantsList = [
//     { id:1, name:"Acme Corporation",  code:"ACME", type:"Enterprise" },
//     { id:2, name:"TechGlobal Inc",    code:"TGI",  type:"Enterprise" },
//     { id:3, name:"CloudServe",        code:"CS",   type:"Service Provider" },
//     { id:4, name:"DataBank",          code:"DB",   type:"Colocation" },
//     { id:5, name:"NetSolutions",      code:"NS",   type:"Enterprise" },
//   ];
//   const countriesList = [
//     { id:1, name:"United States", code:"USA" },
//     { id:3, name:"India",         code:"IND" },
//     { id:6, name:"Canada",        code:"CAN" },
//     { id:8, name:"Singapore",     code:"SGP" },
//   ];
//   const statesList = [
//     { id:1,  name:"California",     code:"CA", countryId:1 },
//     { id:2,  name:"Texas",          code:"TX", countryId:1 },
//     { id:4,  name:"Virginia",       code:"VA", countryId:1 },
//     { id:5,  name:"Ontario",        code:"ON", countryId:6 },
//     { id:8,  name:"Maharashtra",    code:"MH", countryId:3 },
//     { id:9,  name:"Karnataka",      code:"KA", countryId:3 },
//     { id:17, name:"Central Region", code:"CR", countryId:8 },
//   ];
//   const citiesList = [
//     { id:1,  name:"Los Angeles",   code:"LAX", stateId:1,  countryId:1 },
//     { id:2,  name:"San Francisco", code:"SFO", stateId:1,  countryId:1 },
//     { id:9,  name:"Ashburn",       code:"IAD", stateId:4,  countryId:1 },
//     { id:11, name:"Toronto",       code:"YYZ", stateId:5,  countryId:6 },
//     { id:15, name:"Mumbai",        code:"BOM", stateId:8,  countryId:3 },
//     { id:17, name:"Bangalore",     code:"BLR", stateId:9,  countryId:3 },
//     { id:26, name:"Singapore",     code:"SIN", stateId:17, countryId:8 },
//   ];
//   const sitesList = [
//     { id:1,  name:"Building A",       code:"BLD-A", cityId:1  },
//     { id:3,  name:"Building C",       code:"BLD-C", cityId:2  },
//     { id:10, name:"Campus A",         code:"CA",    cityId:9  },
//     { id:12, name:"Core Building",    code:"CORE",  cityId:11 },
//     { id:14, name:"DC Building",      code:"DCB",   cityId:15 },
//     { id:15, name:"Hub 1",            code:"H1",    cityId:17 },
//     { id:19, name:"Singapore Site 1", code:"SGS1",  cityId:26 },
//   ];
//   const usersList = [
//     { id:1, name:"John Smith",   email:"john.smith@datacenter.com",  phone:"+1 213 555 1234",  role:"Facility Manager" },
//     { id:2, name:"Jane Doe",     email:"jane.doe@datacenter.com",    phone:"+1 415 555 5678",  role:"Operations Lead"  },
//     { id:3, name:"Mike Wilson",  email:"mike.wilson@datacenter.ca",  phone:"+1 416 555 9012",  role:"Site Supervisor"  },
//     { id:4, name:"Rajesh Kumar", email:"rajesh.kumar@datacenter.in", phone:"+91 22 5555 1234", role:"DC Manager"       },
//     { id:5, name:"Sarah Tan",    email:"sarah.tan@datacenter.sg",    phone:"+65 6789 0123",    role:"Regional Head"    },
//   ];

//   const emptyForm = {
//     dataCenterName:"", dataCenterCode:"", countryId:"", stateId:"", cityId:"",
//     locationName:"", streetAddress:"", pinCode:"", latitude:"", longitude:"",
//     siteId:"", tenantId:"", totalRacks:"", utilizedRacks:"",
//     powerCapacity:"", coolingCapacity:"", contactPersonId:"",
//     contactEmail:"", contactPhone:"", status: true,
//     // ── NEW ──
//     dcLength:"", dcLengthUnit:"m", dcBreadth:"", dcBreadthUnit:"m",
//     totalKW: "", totalKWUnit: "kW",
//     margins: { top: 2, bottom: 2, left: 2, right: 2, unit: "m" },
//   };
//   const emptyErrors = Object.fromEntries(Object.keys(emptyForm).map(k => [k, ""]));

//   const [formData, setFormData]     = useState(emptyForm);
//   const [formErrors, setFormErrors] = useState(emptyErrors);

//   const [dataCenters, setDataCenters] = useState([
//     { id:1, dataCenterName:"LAX1 - Main Facility", dataCenterCode:"LAX-MAIN-01", countryId:1, countryName:"United States", stateId:1, stateName:"California", cityId:1, cityName:"Los Angeles", locationName:"Main Data Center", streetAddress:"123 Main Street", pinCode:"90001", latitude:"34.0522", longitude:"-118.2437", siteId:1, siteName:"Building A", tenantId:1, tenantName:"Acme Corporation", totalRacks:500, utilizedRacks:325, powerCapacity:2500, coolingCapacity:750, contactPersonId:1, contactPersonName:"John Smith", contactEmail:"john.smith@datacenter.com", contactPhone:"+1 213 555 1234", status:"Active", createdDate:"2024-01-15", dcLength:40, dcLengthUnit:"km", dcBreadth:25, dcBreadthUnit:"km", totalKW:2000, totalKWUnit:"kW", margins:{top:2,bottom:2,left:2,right:2,unit:"m"} },
//     { id:2, dataCenterName:"SFO - Edge Facility",  dataCenterCode:"SFO-EDGE-02", countryId:1, countryName:"United States", stateId:1, stateName:"California", cityId:2, cityName:"San Francisco", locationName:"Edge Facility - West", streetAddress:"456 Market Street", pinCode:"94105", latitude:"37.7749", longitude:"-122.4194", siteId:3, siteName:"Building C", tenantId:2, tenantName:"TechGlobal Inc", totalRacks:250, utilizedRacks:180, powerCapacity:1200, coolingCapacity:350, contactPersonId:2, contactPersonName:"Jane Doe", contactEmail:"jane.doe@datacenter.com", contactPhone:"+1 415 555 5678", status:"Active", createdDate:"2024-02-20", dcLength:80, dcLengthUnit:"km", dcBreadth:50, dcBreadthUnit:"km", totalKW:1000, totalKWUnit:"kW", margins:{top:2,bottom:2,left:2,right:2,unit:"m"} },
//     { id:3, dataCenterName:"TOR - Core Facility",  dataCenterCode:"TOR-CORE-03", countryId:6, countryName:"Canada", stateId:5, stateName:"Ontario", cityId:11, cityName:"Toronto", locationName:"Toronto Core", streetAddress:"789 Bay Street", pinCode:"M5G 2C8", latitude:"43.6532", longitude:"-79.3832", siteId:12, siteName:"Core Building", tenantId:3, tenantName:"CloudServe", totalRacks:400, utilizedRacks:220, powerCapacity:2000, coolingCapacity:600, contactPersonId:3, contactPersonName:"Mike Wilson", contactEmail:"mike.wilson@datacenter.ca", contactPhone:"+1 416 555 9012", status:"Active", createdDate:"2024-03-10", dcLength:35, dcLengthUnit:"km", dcBreadth:20, dcBreadthUnit:"km", totalKW:1500, totalKWUnit:"kW", margins:{top:2,bottom:2,left:2,right:2,unit:"m"} },
//     { id:4, dataCenterName:"MUM - DR Site",        dataCenterCode:"MUM-DR-04",   countryId:3, countryName:"India", stateId:8, stateName:"Maharashtra", cityId:15, cityName:"Mumbai", locationName:"Mumbai DC", streetAddress:"321 Business Park", pinCode:"400001", latitude:"19.0760", longitude:"72.8777", siteId:14, siteName:"DC Building", tenantId:4, tenantName:"DataBank", totalRacks:150, utilizedRacks:75, powerCapacity:800, coolingCapacity:200, contactPersonId:4, contactPersonName:"Rajesh Kumar", contactEmail:"rajesh.kumar@datacenter.in", contactPhone:"+91 22 5555 1234", status:"Maintenance", createdDate:"2024-04-05", dcLength:20, dcLengthUnit:"km", dcBreadth:15, dcBreadthUnit:"km", totalKW:600, totalKWUnit:"kW", margins:{top:2,bottom:2,left:2,right:2,unit:"m"} },
//     { id:5, dataCenterName:"SIN - Hub Facility",   dataCenterCode:"SIN-HUB-05",  countryId:8, countryName:"Singapore", stateId:17, stateName:"Central Region", cityId:26, cityName:"Singapore", locationName:"Singapore Hub", streetAddress:"1 Raffles Place", pinCode:"048616", latitude:"1.2843", longitude:"103.8510", siteId:19, siteName:"Singapore Site 1", tenantId:5, tenantName:"NetSolutions", totalRacks:300, utilizedRacks:290, powerCapacity:1500, coolingCapacity:450, contactPersonId:5, contactPersonName:"Sarah Tan", contactEmail:"sarah.tan@datacenter.sg", contactPhone:"+65 6789 0123", status:"Warning", createdDate:"2024-05-12", dcLength:30, dcLengthUnit:"km", dcBreadth:22, dcBreadthUnit:"km", totalKW:1200, totalKWUnit:"kW", margins:{top:2,bottom:2,left:2,right:2,unit:"m"} },
//   ]);

//   // ── Computed ──────────────────────────────────────────────────────────────
//   const totalCount       = dataCenters.length;
//   const activeCount      = dataCenters.filter(d => d.status === "Active").length;
//   const maintenanceCount = dataCenters.filter(d => d.status === "Maintenance").length;
//   const warningCount     = dataCenters.filter(d => d.status === "Warning").length;
//   const totalRacksCap    = dataCenters.reduce((s, d) => s + (d.totalRacks || 0), 0);
//   const totalRacksUsed   = dataCenters.reduce((s, d) => s + (d.utilizedRacks || 0), 0);
//   const uniqueCountries  = [...new Map(dataCenters.map(d => [d.countryId, { id: d.countryId, name: d.countryName }])).values()];

//   const filteredDCs = dataCenters.filter(d => {
//     const q = searchText.toLowerCase();
//     const matchSearch  = !searchText || d.dataCenterName.toLowerCase().includes(q) || d.dataCenterCode.toLowerCase().includes(q) || d.locationName.toLowerCase().includes(q) || d.cityName.toLowerCase().includes(q) || d.countryName.toLowerCase().includes(q);
//     const matchCountry = countryFilter === "all" || d.countryId === countryFilter;
//     const matchStatus  = statusFilter  === "all" || d.status === statusFilter;
//     return matchSearch && matchCountry && matchStatus;
//   });

//   // ── Validation ────────────────────────────────────────────────────────────
//   const validators = {
//     dataCenterName:  v => !v ? "Required" : v.length < 3 ? "Min 3 chars" : "",
//     dataCenterCode:  v => !v ? "Required" : !/^[A-Z0-9-]+$/i.test(v) ? "Alphanumeric & hyphens only" : "",
//     countryId:       v => !v ? "Select a country" : "",
//     stateId:         v => !v ? "Select a state"   : "",
//     cityId:          v => !v ? "Select a city"    : "",
//     locationName:    v => !v ? "Required" : "",
//     streetAddress:   v => !v ? "Required" : "",
//     pinCode:         v => !v ? "Required" : "",
//     siteId:          v => !v ? "Select a site"   : "",
//     tenantId:        v => !v ? "Select a tenant" : "",
//     totalRacks:      v => (v === "" || v === null || v === undefined) ? "" : v < 0 ? "Must be ≥ 0" : "",
//     utilizedRacks:   v => (v === "" || v === null || v === undefined) ? "" : v < 0 ? "Must be ≥ 0" : "",
//     powerCapacity:   v => (v === "" || v === null || v === undefined) ? "" : v < 0 ? "Must be ≥ 0" : "",
//     coolingCapacity: v => (v === "" || v === null || v === undefined) ? "" : v < 0 ? "Must be ≥ 0" : "",
//     contactPersonId: v => !v ? "Select a contact person" : "",
//     latitude:        v => !v ? "" : isNaN(v) || v < -90  || v > 90  ? "Range -90 to 90"   : "",
//     longitude:       v => !v ? "" : isNaN(v) || v < -180 || v > 180 ? "Range -180 to 180" : "",
//     dcLength:        v => (v === "" || v === null || v === undefined) ? "" : v <= 0 ? "Must be > 0" : "",
//     dcBreadth:       v => (v === "" || v === null || v === undefined) ? "" : v <= 0 ? "Must be > 0" : "",
//     totalKW:         v => (v === "" || v === null || v === undefined) ? "" : v < 0 ? "Must be ≥ 0" : "",
//   };
//   const validateAll = () => {
//     const errs = Object.fromEntries(Object.keys(validators).map(k => [k, validators[k](formData[k])]));
//     setFormErrors(prev => ({ ...prev, ...errs }));
//     return Object.values(errs).every(e => !e);
//   };
//   const setErr = (field, val) => setFormErrors(prev => ({ ...prev, [field]: validators[field]?.(val) ?? "" }));

//   // ── Handlers ──────────────────────────────────────────────────────────────
//   const handleInputChange  = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); setErr(name, value); };
//   const handleNumberChange = (name, value) => { setFormData(prev => ({ ...prev, [name]: value })); setErr(name, value); };
//   const handleSelectChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

//   // ── Power unit conversion helper ────────────────────────────────────────
//   const convertPowerValue = (value, fromUnit, toUnit) => {
//     if (!value || value === "" || value === null || value === undefined) return null;
    
//     const numValue = parseFloat(value);
//     if (isNaN(numValue)) return null;

//     // Conversion factors to kW
//     const toKW = {
//       "kW": 1,
//       "MW": 1000,
//       "BTU/h": 0.000293071, // 1 BTU/h = 0.000293071 kW
//       "Tons": 3.517, // 1 Ton = 3.517 kW
//       "kVA": 0.8, // Assuming 0.8 power factor
//       "HP": 0.7457, // 1 HP = 0.7457 kW
//     };

//     // Convert to kW first
//     const inKW = numValue * (toKW[fromUnit] || 1);
    
//     // Convert from kW to target unit
//     const fromKW = {
//       "kW": 1,
//       "MW": 1/1000,
//       "BTU/h": 1/0.000293071,
//       "Tons": 1/3.517,
//       "kVA": 1/0.8,
//       "HP": 1/0.7457,
//     };

//     return inKW * (fromKW[toUnit] || 1);
//   };

//   // ── Auto-calculate power capacity when totalKW changes ──────────────
//   const handlePowerChange = (value, unit) => {
//     // Update totalKW and its unit
//     setFormData(prev => ({
//       ...prev,
//       totalKW: value,
//       totalKWUnit: unit || prev.totalKWUnit,
//     }));

//     if (value && value > 0 && unit) {
//       // Convert to kW for capacity calculations
//       const kWValue = convertPowerValue(value, unit, "kW");
      
//       if (kWValue !== null) {
//         // Calculate power and cooling capacities based on kW
//         const powerCap = Math.round(kWValue * 1.2); // 120% of total kW
//         const coolingCap = Math.round(kWValue * 0.35); // 35% of total kW in TR
        
//         setFormData(prev => ({
//           ...prev,
//           powerCapacity: powerCap,
//           coolingCapacity: coolingCap,
//         }));
//       }
//     }
//   };

//   const handleCountryChange = (v) => {
//     setAvailableStates(statesList.filter(s => s.countryId === v));
//     setAvailableCities([]); setAvailableSites([]);
//     setFormData(prev => ({ ...prev, countryId: v, stateId: "", cityId: "", siteId: "" }));
//     setFormErrors(prev => ({ ...prev, countryId: "", stateId: "", cityId: "", siteId: "" }));
//   };
//   const handleStateChange = (v) => {
//     setAvailableCities(citiesList.filter(c => c.stateId === v));
//     setAvailableSites([]);
//     setFormData(prev => ({ ...prev, stateId: v, cityId: "", siteId: "" }));
//     setFormErrors(prev => ({ ...prev, stateId: "", cityId: "", siteId: "" }));
//   };
//   const handleCityChange = (v) => {
//     setAvailableSites(sitesList.filter(s => s.cityId === v));
//     setFormData(prev => ({ ...prev, cityId: v, siteId: "" }));
//     setFormErrors(prev => ({ ...prev, cityId: "", siteId: "" }));
//   };
//   const handleContactChange = (v) => {
//     const u = usersList.find(x => x.id === v);
//     setFormData(prev => ({ ...prev, contactPersonId: v, contactEmail: u?.email || "", contactPhone: u?.phone || "" }));
//     setErr("contactPersonId", v);
//   };

//   const openAddModal = () => {
//     setEditingDC(null); setFormData(emptyForm); setFormErrors(emptyErrors);
//     setAvailableStates([]); setAvailableCities([]); setAvailableSites([]);
//     setShowModal(true);
//   };
//   const openEditModal = (dc) => {
//     setEditingDC(dc);
//     setAvailableStates(statesList.filter(s => s.countryId === dc.countryId));
//     setAvailableCities(citiesList.filter(c => c.stateId === dc.stateId));
//     setAvailableSites(sitesList.filter(s => s.cityId === dc.cityId));
//     setFormData({
//       dataCenterName: dc.dataCenterName, dataCenterCode: dc.dataCenterCode,
//       countryId: dc.countryId, stateId: dc.stateId, cityId: dc.cityId,
//       locationName: dc.locationName, streetAddress: dc.streetAddress,
//       pinCode: dc.pinCode, latitude: dc.latitude, longitude: dc.longitude,
//       siteId: dc.siteId, tenantId: dc.tenantId,
//       totalRacks: dc.totalRacks, utilizedRacks: dc.utilizedRacks,
//       powerCapacity: dc.powerCapacity, coolingCapacity: dc.coolingCapacity,
//       contactPersonId: dc.contactPersonId, contactEmail: dc.contactEmail, contactPhone: dc.contactPhone,
//       status: dc.status === "Active",
//       dcLength: dc.dcLength || "", dcLengthUnit: dc.dcLengthUnit || "m",
//       dcBreadth: dc.dcBreadth || "", dcBreadthUnit: dc.dcBreadthUnit || "m",
//       totalKW: dc.totalKW || "",
//       totalKWUnit: dc.totalKWUnit || "kW",
//       margins: dc.margins || { top: 2, bottom: 2, left: 2, right: 2, unit: "m" },
//     });
//     setFormErrors(emptyErrors);
//     setShowModal(true);
//   };

//   // ── Open the 5D view INLINE (no route navigation) ──────────────────────
//   const open3DView = (dc) => {
//     setViewing3DDC(dc);
//     setShow3DView(true);
//   };
//   const close3DView = () => {
//     setShow3DView(false);
//     setViewing3DDC(null);
//   };

//   const openDeleteModal  = (dc) => { setDcToDelete(dc); setShowDeleteModal(true); };
//   const closeModal       = () => { setShowModal(false); setEditingDC(null); };
//   const closeDeleteModal = () => { setShowDeleteModal(false); setDcToDelete(null); };

//   const handleDelete = () => {
//     if (dcToDelete) {
//       setDataCenters(dataCenters.filter(d => d.id !== dcToDelete.id));
//       message.success("Data center deleted!");
//       closeDeleteModal();
//     }
//   };

//   const handleSubmit = () => {
//     if (!validateAll()) { message.error("Please fix the errors in the form"); return; }
//     setLoading(true);
//     const country = countriesList.find(c => c.id === formData.countryId);
//     const state   = statesList.find(s => s.id === formData.stateId);
//     const city    = citiesList.find(c => c.id === formData.cityId);
//     const site    = sitesList.find(s => s.id === formData.siteId);
//     const tenant  = tenantsList.find(t => t.id === formData.tenantId);
//     const contact = usersList.find(u => u.id === formData.contactPersonId);
//     setTimeout(() => {
//       // Convert totalKW to kW for storage if needed
//       let totalKWValue = parseFloat(formData.totalKW) || 0;
//       let totalKWUnit = formData.totalKWUnit || "kW";
      
//       // If unit is not kW, convert to kW for consistent storage
//       if (totalKWUnit !== "kW" && totalKWValue > 0) {
//         const kWValue = convertPowerValue(totalKWValue, totalKWUnit, "kW");
//         if (kWValue !== null) {
//           totalKWValue = kWValue;
//           totalKWUnit = "kW";
//         }
//       }
      
//       const payload = {
//         ...formData,
//         dataCenterCode: formData.dataCenterCode.toUpperCase(),
//         countryName: country?.name || "", stateName: state?.name || "",
//         cityName: city?.name || "", siteName: site?.name || "",
//         tenantName: tenant?.name || "", contactPersonName: contact?.name || "",
//         totalRacks: parseInt(formData.totalRacks) || 0,
//         utilizedRacks: parseInt(formData.utilizedRacks) || 0,
//         powerCapacity: parseInt(formData.powerCapacity) || 0,
//         coolingCapacity: parseInt(formData.coolingCapacity) || 0,
//         status: formData.status ? "Active" : "Inactive",
//         dcLength: parseFloat(formData.dcLength) || 0,
//         dcBreadth: parseFloat(formData.dcBreadth) || 0,
//         totalKW: totalKWValue,
//         totalKWUnit: totalKWUnit,
//         margins: formData.margins || { top:2, bottom:2, left:2, right:2, unit:"m" },
//       };
//       if (editingDC) {
//         setDataCenters(dataCenters.map(d => d.id === editingDC.id ? { ...d, ...payload } : d));
//         message.success("Data center updated!");
//       } else {
//         const newDC = { id: Date.now(), ...payload, createdDate: new Date().toISOString().split("T")[0] };
//         setDataCenters([...dataCenters, newDC]);
//         message.success("Data center added!");
//       }
//       setLoading(false); closeModal();
//     }, 500);
//   };

//   const handleTableChange = (_, __, sorter) => setSortedInfo(sorter);

//   // ── Stat Card ─────────────────────────────────────────────────────────────
//   const StatCard = ({ label, value, color, icon }) => (
//     <div style={{ backgroundColor: "white", borderRadius: 6, padding: "8px 14px", borderTop: `3px solid ${color}`, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
//       <span style={{ fontSize: 22, color }}>{icon}</span>
//       <div>
//         <div style={{ fontSize: 11, color: "#888", lineHeight: 1.3 }}>{label}</div>
//         <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
//       </div>
//     </div>
//   );

//   // ── Shared style tokens ───────────────────────────────────────────────────
//   const backdropStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000 };
//   const modalBoxStyle = (w) => ({ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", backgroundColor: "white", padding: "20px", borderRadius: "8px", width: w, maxWidth: "95%", maxHeight: "92vh", overflowY: "auto", zIndex: 1001, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" });
//   const lbl     = { display: "block", marginBottom: 4, fontWeight: 500, fontSize: 13 };
//   const errText = (msg) => msg ? <Text type="danger" style={{ fontSize: 11, marginTop: 2, display: "block" }}>{msg}</Text> : null;
//   const inputStyle = { width: "100%", padding: "5px 10px", border: "1px solid #d9d9d9", borderRadius: 6, fontSize: 13, boxSizing: "border-box", outline: "none", fontFamily: "inherit" };

//   const statusBadge = (s) => {
//     const map = { Active: "success", Maintenance: "warning", Warning: "error", Inactive: "default" };
//     return <Badge status={map[s] || "default"} text={<span style={{ fontSize: 11 }}>{s}</span>} />;
//   };
//   const dcAvatarColor = (s) => s === "Active" ? "#1890ff" : s === "Warning" ? "#faad14" : s === "Maintenance" ? "#722ed1" : "#d9d9d9";
//   const utilPct = (used, total) => total ? Math.round((used / total) * 100) : 0;

//   // ── Dimension field helper ─────────────────────────────────────────────
//   const DimField = ({ label, numField, unitField }) => (
//     <div>
//       <label style={lbl}>{label} <Text type="secondary" style={{ fontSize: 11 }}>(optional)</Text></label>
//       <Input.Group compact>
//         <InputNumber
//           value={formData[numField]}
//           onChange={v => handleNumberChange(numField, v)}
//           size="small"
//           placeholder="e.g., 40"
//           min={0}
//           style={{ width: "calc(100% - 72px)" }}
//           status={formErrors[numField] ? "error" : ""}
//         />
//         <Select
//           value={formData[unitField]}
//           onChange={v => handleSelectChange(unitField, v)}
//           size="small"
//           style={{ width: 72 }}
//         >
//           {DIMENSION_UNITS.map(u => <Option key={u.value} value={u.value}>{u.label}</Option>)}
//         </Select>
//       </Input.Group>
//       {errText(formErrors[numField])}
//     </div>
//   );

//   // ── Select helper ─────────────────────────────────────────────────────────
//   const fldSelect = (field, label, opts, required, placeholder, disabled, hint) => (
//     <div>
//       <label style={lbl}>{label}{required && <span style={{ color: "#ff4d4f" }}> *</span>}</label>
//       <Select
//         value={formData[field] || undefined}
//         onChange={v => { setFormData(prev => ({ ...prev, [field]: v })); setErr(field, v); }}
//         size="small" style={{ width: "100%" }} placeholder={placeholder}
//         showSearch optionFilterProp="children" disabled={disabled}
//         status={formErrors[field] ? "error" : ""}
//       >
//         {opts.map(o => <Option key={o.id} value={o.id}>{o.label || o.name}</Option>)}
//       </Select>
//       {errText(formErrors[field])}
//       {disabled && hint && !formErrors[field] && <Text type="secondary" style={{ fontSize: 11 }}>{hint}</Text>}
//     </div>
//   );

//   // ── Columns ───────────────────────────────────────────────────────────────
//   const columns = [
//     { title: "ID", dataIndex: "id", key: "id", width: 48,
//       sorter: (a, b) => a.id - b.id, sortOrder: sortedInfo.columnKey === "id" && sortedInfo.order,
//       render: t => <Text style={{ fontSize: 11 }}>{t}</Text> },
//     { title: "Data Center", key: "dc", width: 160, ellipsis: true,
//       sorter: (a, b) => a.dataCenterName.localeCompare(b.dataCenterName),
//       render: (_, r) => (
//         <Space size={4}>
//           <Avatar icon={<CloudServerOutlined />} style={{ backgroundColor: dcAvatarColor(r.status), flexShrink: 0 }} size={20} />
//           <div>
//             <Text strong style={{ fontSize: 11 }}>{r.dataCenterName}</Text>
//             <div><Text type="secondary" style={{ fontSize: 10 }}>{r.dataCenterCode}</Text></div>
//           </div>
//         </Space>
//       ) },
//     { title: "Location", key: "location", width: 160, ellipsis: true,
//       sorter: (a, b) => a.locationName.localeCompare(b.locationName),
//       render: (_, r) => (
//         <div>
//           <Space size={4}><EnvironmentOutlined style={{ color: "#1890ff", fontSize: 10 }} /><Text strong style={{ fontSize: 11 }}>{r.locationName}</Text></Space>
//           <div><Text type="secondary" style={{ fontSize: 10 }}>{r.cityName}, {r.countryName}</Text></div>
//           <div><Text type="secondary" style={{ fontSize: 10 }}>Site: {r.siteName} · {r.tenantName}</Text></div>
//         </div>
//       ) },
//     { title: "Dimensions", key: "dims", width: 100,
//       render: (_, r) => r.dcLength && r.dcBreadth ? (
//         <div>
//           <Text style={{ fontSize: 10 }}>{r.dcLength}{r.dcLengthUnit} × {r.dcBreadth}{r.dcBreadthUnit}</Text>
//           <div><Text type="secondary" style={{ fontSize: 10 }}>L × B</Text></div>
//         </div>
//       ) : <Text type="secondary" style={{ fontSize: 10 }}>—</Text>
//     },
//     { title: "Power", key: "power", width: 100,
//       render: (_, r) => (
//         <div>
//           <Text style={{ fontSize: 10 }}>{r.totalKW || r.powerCapacity || 0} {r.totalKWUnit || "kW"}</Text>
//           <div><Text type="secondary" style={{ fontSize: 10 }}>Total Capacity</Text></div>
//         </div>
//       )
//     },
//     { title: "Racks", key: "racks", width: 110,
//       sorter: (a, b) => utilPct(a.utilizedRacks, a.totalRacks) - utilPct(b.utilizedRacks, b.totalRacks),
//       render: (_, r) => {
//         const pct = utilPct(r.utilizedRacks, r.totalRacks);
//         return (
//           <Tooltip title={`${r.utilizedRacks}/${r.totalRacks} racks`}>
//             <div>
//               <Text style={{ fontSize: 10 }}>{r.utilizedRacks}/{r.totalRacks}</Text>
//               <Progress percent={pct} size="small" showInfo={false}
//                 status={pct > 90 ? "exception" : pct > 70 ? "active" : "normal"} />
//             </div>
//           </Tooltip>
//         );
//       } },
//     { title: "Power / Cooling", key: "specs", width: 120,
//       render: (_, r) => (
//         <div>
//           <Space size={4}><ThunderboltOutlined style={{ color: "#fa8c16", fontSize: 10 }} /><Text style={{ fontSize: 10 }}>{r.powerCapacity} kW</Text></Space>
//           <div><Space size={4}><HeatMapOutlined style={{ color: "#13c2c2", fontSize: 10 }} /><Text style={{ fontSize: 10 }}>{r.coolingCapacity} TR</Text></Space></div>
//         </div>
//       ) },
//     { title: "Contact", key: "contact", width: 155, ellipsis: true,
//       render: (_, r) => (
//         <div>
//           <Space size={4}><UserOutlined style={{ color: "#1890ff", fontSize: 10 }} /><Text style={{ fontSize: 11 }}>{r.contactPersonName}</Text></Space>
//           <div><Space size={4}><MailOutlined style={{ color: "#722ed1", fontSize: 10 }} /><Text style={{ fontSize: 10 }}>{r.contactEmail}</Text></Space></div>
//         </div>
//       ) },
//     { title: "Created", dataIndex: "createdDate", key: "createdDate", width: 88,
//       sorter: (a, b) => new Date(a.createdDate) - new Date(b.createdDate),
//       render: t => <Text style={{ fontSize: 10 }}>{t}</Text> },
//     { title: "Status", dataIndex: "status", key: "status", width: 100,
//       sorter: (a, b) => a.status.localeCompare(b.status),
//       render: t => statusBadge(t),
//       filters: ["Active","Maintenance","Warning","Inactive"].map(v => ({ text: v, value: v })),
//       onFilter: (v, r) => r.status === v },
//     {
//       title: "", key: "actions", width: 90, fixed: "right",
//       render: (_, r) => (
//         <Space size={0}>
//           <Tooltip title="5D View">
//             <Button
//               type="text" size="small"
//               icon={<EyeOutlined />}
//               onClick={() => open3DView(r)}
//               style={{
//                 color: "#00aaff", padding: "0 3px",
//                 background: "rgba(0,170,255,0.08)",
//                 border: "1px solid rgba(0,170,255,0.2)",
//                 borderRadius: 4, margin: "0 2px",
//               }}
//             />
//           </Tooltip>
//           <Tooltip title="Edit">
//             <Button type="text" size="small" icon={<EditOutlined />}
//               onClick={() => openEditModal(r)} style={{ color: "#1890ff", padding: "0 3px" }} />
//           </Tooltip>
//           <Tooltip title="Delete">
//             <Button type="text" size="small" icon={<DeleteOutlined />}
//               onClick={() => openDeleteModal(r)} style={{ color: "#ff4d4f", padding: "0 3px" }} />
//           </Tooltip>
//         </Space>
//       ),
//     },
//   ];

//   // ══════════════════════════════════════════════════════════════════════════
//   // If the 5D viewer is open, render it full-screen in place of the list view.
//   // ══════════════════════════════════════════════════════════════════════════
//   if (show3DView && viewing3DDC) {
//     return (
//       <div style={{ height: "100vh", width: "100%" }}>
//         <DataCenter3DView
//           dc={viewing3DDC}
//           onBack={close3DView}
//           rooms={dcRooms[viewing3DDC.id] || []}
//           theme={viewer3DTheme}
//           onThemeChange={setViewer3DTheme}
//         />
//       </div>
//     );
//   }

//   return (
//     <div style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f0f2f5", padding: "10px 16px", boxSizing: "border-box", overflow: "hidden" }}>

//       {/* ── HEADER ── */}
//       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexShrink: 0 }}>
//         <div>
//           <Title level={4} style={{ margin: 0, lineHeight: 1.3 }}>
//             <CloudServerOutlined style={{ marginRight: 8, color: "#1890ff" }} />
//             Data Center Management
//           </Title>
//           <Text type="secondary" style={{ fontSize: 12 }}>Manage data center facilities and infrastructure</Text>
//         </div>
//         <Space>
//           <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal} size="small"
//             style={{ background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)", border: "none" }}>
//             Add Data Center
//           </Button>
//           <Button icon={<ReloadOutlined />} size="small" onClick={() => window.location.reload()}>Refresh</Button>
//         </Space>
//       </div>

//       {/* ── STAT CARDS ── */}
//       <Row gutter={10} style={{ marginBottom: 8, flexShrink: 0 }}>
//         <Col span={4}><StatCard label="Total DCs"        value={totalCount}       color="#1890ff" icon={<CloudServerOutlined style={{ color: "#1890ff" }} />} /></Col>
//         <Col span={4}><StatCard label="Active"           value={activeCount}      color="#52c41a" icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />} /></Col>
//         <Col span={4}><StatCard label="Maintenance"      value={maintenanceCount} color="#722ed1" icon={<ApiOutlined         style={{ color: "#722ed1" }} />} /></Col>
//         <Col span={4}><StatCard label="Warning"          value={warningCount}     color="#faad14" icon={<ExclamationCircleOutlined style={{ color: "#faad14" }} />} /></Col>
//         <Col span={8}><StatCard label="Rack Utilization" value={`${totalRacksUsed} / ${totalRacksCap}`} color="#13c2c2" icon={<DashboardOutlined style={{ color: "#13c2c2" }} />} /></Col>
//       </Row>

//       {/* ── FILTERS ── */}
//       <div style={{ backgroundColor: "white", borderRadius: 6, padding: "8px 12px", marginBottom: 8, flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
//         <Row gutter={16} align="middle">
//           <Col xs={24} sm={24} md={10} lg={10}>
//             <Input placeholder="Search by name, code, location, city..."
//               prefix={<SearchOutlined style={{ color: "#bbb" }} />}
//               value={searchText} onChange={e => setSearchText(e.target.value)} allowClear size="small" />
//           </Col>
//           <Col xs={8} sm={6} md={5} lg={5}>
//             <Select value={countryFilter} onChange={setCountryFilter} size="small" style={{ width: "100%" }}>
//               <Option value="all">All Countries</Option>
//               {uniqueCountries.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
//             </Select>
//           </Col>
//           <Col xs={8} sm={6} md={4} lg={4}>
//             <Select value={statusFilter} onChange={setStatusFilter} size="small" style={{ width: "100%" }}>
//               <Option value="all">All Status</Option>
//               {["Active","Maintenance","Warning","Inactive"].map(s => <Option key={s} value={s}>{s}</Option>)}
//             </Select>
//           </Col>
//           <Col xs={0} sm={0} md={5} lg={5} style={{ textAlign: "right" }}>
//             <Text style={{ fontSize: 12, color: "#888", whiteSpace: "nowrap" }}>{filteredDCs.length} / {totalCount} shown</Text>
//           </Col>
//         </Row>
//       </div>

//       {/* ── TABLE ── */}
//       <div style={{ flex: 1, backgroundColor: "white", borderRadius: 6, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
//         <div style={{ padding: "7px 14px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
//           <Text strong style={{ fontSize: 13 }}>Data Centers List</Text>
//           <Badge count={filteredDCs.length} style={{ backgroundColor: "#1890ff" }} />
//         </div>
//         <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
//           <Table
//             columns={columns} dataSource={filteredDCs} loading={loading}
//             bordered={false} rowKey="id" size="small" scroll={{ x: "max-content" }}
//             pagination={{ pageSize: 8, showSizeChanger: false, showTotal: total => `${total} data centers`, size: "small", style: { padding: "5px 14px", margin: 0 } }}
//             onChange={handleTableChange} style={{ fontSize: 12 }}
//             locale={{ emptyText: <div style={{ padding: "12px 0", textAlign: "center", color: "#999", fontSize: 13 }}>No data found</div> }}
//           />
//         </div>
//       </div>

//       {/* ── FOOTER ── */}
//       <div style={{ textAlign: "center", paddingTop: 4, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
//       </div>


//       {/* ══ ADD / EDIT MODAL ══ */}
//       {showModal && (
//         <>
//           <div style={backdropStyle} onClick={closeModal} />
//           <div style={modalBoxStyle("900px")}>
//             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
//               <h3 style={{ margin: 0, color: "#1890ff", fontSize: 15 }}>
//                 {editingDC ? "Edit Data Center" : "Add New Data Center"}
//               </h3>
//               <Button type="text" icon={<CloseOutlined />} onClick={closeModal} style={{ color: "#666" }} />
//             </div>

//              {/* ── Technical Specifications ── */}
//             <Divider style={{ margin: "4px 0 12px" }}>
//               <Space size={4}><DashboardOutlined style={{ color: "#13c2c2" }} /><Text style={{ fontSize: 12 }} strong>Technical Specifications</Text></Space>
//             </Divider>
//             <Row gutter={12} style={{ marginBottom: 14 }}>
//               <Col span={6}>
//                 <label style={lbl}>Total Racks</label>
//                 <InputNumber value={formData.totalRacks} onChange={v => handleNumberChange("totalRacks", v)} size="small" style={{ width: "100%" }} placeholder="e.g., 500" min={0} max={10000} status={formErrors.totalRacks ? "error" : ""} />
//                 {errText(formErrors.totalRacks)}
//               </Col>
//               <Col span={6}>
//                 <label style={lbl}>Utilized Racks</label>
//                 <InputNumber value={formData.utilizedRacks} onChange={v => handleNumberChange("utilizedRacks", v)} size="small" style={{ width: "100%" }} placeholder="e.g., 325" min={0} max={formData.totalRacks || 10000} status={formErrors.utilizedRacks ? "error" : ""} />
//                 {errText(formErrors.utilizedRacks)}
//               </Col>
//               <Col span={6}>
//                 <label style={lbl}>Power Capacity (kW)</label>
//                 <InputNumber value={formData.powerCapacity} onChange={v => handleNumberChange("powerCapacity", v)} size="small" style={{ width: "100%" }} placeholder="e.g., 2500" min={0} max={10000} status={formErrors.powerCapacity ? "error" : ""} />
//                 {errText(formErrors.powerCapacity)}
//               </Col>
//               <Col span={6}>
//                 <label style={lbl}>Cooling Capacity (TR)</label>
//                 <InputNumber value={formData.coolingCapacity} onChange={v => handleNumberChange("coolingCapacity", v)} size="small" style={{ width: "100%" }} placeholder="e.g., 750" min={0} max={5000} status={formErrors.coolingCapacity ? "error" : ""} />
//                 {errText(formErrors.coolingCapacity)}
//               </Col>
//             </Row>

//             {/* ── Total KW with Units ── */}
//             <Row gutter={12} style={{ marginBottom: 14 }}>
//               <Col span={12}>
//                 <label style={lbl}>Total Power Capacity 
//                   <Text type="secondary" style={{ fontSize: 11 }}>
//                     (Auto-calculates Power & Cooling)
//                   </Text>
//                 </label>
//                 <Input.Group compact>
//                   <InputNumber
//                     value={formData.totalKW}
//                     onChange={v => handlePowerChange(v, formData.totalKWUnit)}
//                     size="small"
//                     style={{ width: "calc(100% - 110px)" }}
//                     placeholder="e.g., 2000"
//                     min={0}
//                     status={formErrors.totalKW ? "error" : ""}
//                   />
//                   <Select
//                     value={formData.totalKWUnit}
//                     onChange={v => handlePowerChange(formData.totalKW, v)}
//                     size="small"
//                     style={{ width: 110 }}
//                   >
//                     {POWER_UNITS.map(u => <Option key={u.value} value={u.value}>{u.label}</Option>)}
//                   </Select>
//                 </Input.Group>
//                 {errText(formErrors.totalKW)}
//                 {formData.totalKW && formData.totalKW > 0 && (
//                   <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>
//                     <Space size={12}>
//                       <span>⚡ Power: {formData.powerCapacity || 0} kW</span>
//                       <span>❄️ Cooling: {formData.coolingCapacity || 0} TR</span>
//                     </Space>
//                   </div>
//                 )}
//               </Col>
//               <Col span={12}>
//                 <div style={{ 
//                   background: "#e6f7ff", 
//                   padding: "8px 12px", 
//                   borderRadius: 4, 
//                   border: "1px solid #91d5ff",
//                   height: "100%",
//                   display: "flex",
//                   alignItems: "center"
//                 }}>
//                   <div>
//                     <Text style={{ fontSize: 12, color: "#0050b3" }}>
//                       <strong>Power Unit Info:</strong>
//                     </Text>
//                     <div style={{ fontSize: 11, color: "#0050b3", marginTop: 2 }}>
//                       • <strong>kW</strong> = Kilowatts (1,000 watts)<br/>
//                       • <strong>MW</strong> = Megawatts (1,000,000 watts)<br/>
//                       • <strong>BTU/h</strong> = British Thermal Units per hour<br/>
//                       • <strong>Tons</strong> = Tons of Refrigeration (1 Ton = 3.517 kW)<br/>
//                       • <strong>kVA</strong> = Kilovolt-Amperes (with 0.8 PF)<br/>
//                       • <strong>HP</strong> = Horsepower (1 HP = 0.746 kW)
//                     </div>
//                   </div>
//                 </div>
//               </Col>
//             </Row>


//             {/* ── Location Hierarchy ── */}
//             <Divider style={{ margin: "0 0 12px" }}>
//               <Space size={4}><GlobalOutlined style={{ color: "#1890ff" }} /><Text style={{ fontSize: 12 }} strong>Location Hierarchy</Text></Space>
//             </Divider>
//             <Row gutter={12} style={{ marginBottom: 14 }}>
//               {/* Country */}
//               <Col span={12}>
//                 <div>
//                   <label style={lbl}>Country <span style={{ color: "#ff4d4f" }}>*</span></label>
//                   <Select
//                     value={formData.countryId || undefined}
//                     onChange={handleCountryChange}
//                     size="small" style={{ width: "100%" }}
//                     placeholder="Select country"
//                     showSearch optionFilterProp="children"
//                     status={formErrors.countryId ? "error" : ""}
//                   >
//                     {countriesList.map(c => <Option key={c.id} value={c.id}>{c.name} ({c.code})</Option>)}
//                   </Select>
//                   {errText(formErrors.countryId)}
//                 </div>
//               </Col>
//               {/* State */}
//               <Col span={12}>
//                 <div>
//                   <label style={lbl}>State <span style={{ color: "#ff4d4f" }}>*</span></label>
//                   <Select
//                     value={formData.stateId || undefined}
//                     onChange={handleStateChange}
//                     size="small" style={{ width: "100%" }}
//                     placeholder={formData.countryId ? "Select state" : "Select a country first"}
//                     showSearch optionFilterProp="children"
//                     disabled={!formData.countryId}
//                     status={formErrors.stateId ? "error" : ""}
//                   >
//                     {availableStates.map(s => <Option key={s.id} value={s.id}>{s.name} ({s.code})</Option>)}
//                   </Select>
//                   {errText(formErrors.stateId)}
//                   {!formData.countryId && !formErrors.stateId && <Text type="secondary" style={{ fontSize: 11 }}>Select a country first</Text>}
//                 </div>
//               </Col>
//             </Row>
//             <Row gutter={12} style={{ marginBottom: 14 }}>
//               {/* City */}
//               <Col span={12}>
//                 <div>
//                   <label style={lbl}>City <span style={{ color: "#ff4d4f" }}>*</span></label>
//                   <Select
//                     value={formData.cityId || undefined}
//                     onChange={handleCityChange}
//                     size="small" style={{ width: "100%" }}
//                     placeholder={formData.stateId ? "Select city" : "Select a state first"}
//                     showSearch optionFilterProp="children"
//                     disabled={!formData.stateId}
//                     status={formErrors.cityId ? "error" : ""}
//                   >
//                     {availableCities.map(c => <Option key={c.id} value={c.id}>{c.name} ({c.code})</Option>)}
//                   </Select>
//                   {errText(formErrors.cityId)}
//                   {!formData.stateId && !formErrors.cityId && <Text type="secondary" style={{ fontSize: 11 }}>Select a state first</Text>}
//                 </div>
//               </Col>
//               {/* Site */}
//               <Col span={12}>
//                 <div>
//                   <label style={lbl}>Site <span style={{ color: "#ff4d4f" }}>*</span></label>
//                   <Select
//                     value={formData.siteId || undefined}
//                     onChange={v => { setFormData(prev => ({ ...prev, siteId: v })); setErr("siteId", v); }}
//                     size="small" style={{ width: "100%" }}
//                     placeholder={formData.cityId ? "Select site" : "Select a city first"}
//                     showSearch optionFilterProp="children"
//                     disabled={!formData.cityId}
//                     status={formErrors.siteId ? "error" : ""}
//                   >
//                     {availableSites.map(s => <Option key={s.id} value={s.id}>{s.name} ({s.code})</Option>)}
//                   </Select>
//                   {errText(formErrors.siteId)}
//                   {!formData.cityId && !formErrors.siteId && <Text type="secondary" style={{ fontSize: 11 }}>Select a city first</Text>}
//                 </div>
//               </Col>
//             </Row>

//             {/* ── Basic Information ── */}
//             <Divider style={{ margin: "4px 0 12px" }}>
//               <Space size={4}><CloudServerOutlined style={{ color: "#1890ff" }} /><Text style={{ fontSize: 12 }} strong>Basic Information</Text></Space>
//             </Divider>
//             <Row gutter={12} style={{ marginBottom: 14 }}>
//               <Col span={24}>{fldSelect("tenantId","Tenant",tenantsList.map(t=>({...t,label:`${t.name} (${t.code}) — ${t.type}`})),true,"Select tenant",false,"")}</Col>
//             </Row>
//             <Row gutter={12} style={{ marginBottom: 14 }}>
//               <Col span={12}>
//                 <label style={lbl}>Data Center Name <span style={{ color: "#ff4d4f" }}>*</span></label>
//                 <input name="dataCenterName" value={formData.dataCenterName} onChange={handleInputChange}
//                   style={{ ...inputStyle, borderColor: formErrors.dataCenterName ? "#ff4d4f" : "#d9d9d9" }}
//                   placeholder="e.g., LAX1 - Main Facility"
//                   onFocus={e => e.target.style.borderColor="#1890ff"} onBlur={e => e.target.style.borderColor=formErrors.dataCenterName?"#ff4d4f":"#d9d9d9"} />
//                 {errText(formErrors.dataCenterName)}
//               </Col>
//               <Col span={12}>
//                 <label style={lbl}>Data Center Code <span style={{ color: "#ff4d4f" }}>*</span></label>
//                 <input name="dataCenterCode" value={formData.dataCenterCode} onChange={handleInputChange}
//                   style={{ ...inputStyle, textTransform:"uppercase", borderColor: formErrors.dataCenterCode ? "#ff4d4f" : "#d9d9d9" }}
//                   placeholder="e.g., LAX-MAIN-01"
//                   onFocus={e => e.target.style.borderColor="#1890ff"} onBlur={e => e.target.style.borderColor=formErrors.dataCenterCode?"#ff4d4f":"#d9d9d9"} />
//                 {errText(formErrors.dataCenterCode)}
//               </Col>
//             </Row>

//             {/* ── Location Details ── */}
//             <Divider style={{ margin: "4px 0 12px" }}>
//               <Space size={4}><EnvironmentOutlined style={{ color: "#ff4d4f" }} /><Text style={{ fontSize: 12 }} strong>Location Details</Text></Space>
//             </Divider>
//             <Row gutter={12} style={{ marginBottom: 14 }}>
//               <Col span={24}>
//                 <label style={lbl}>Location Name <span style={{ color: "#ff4d4f" }}>*</span></label>
//                 <input name="locationName" value={formData.locationName} onChange={handleInputChange}
//                   style={{ ...inputStyle, borderColor: formErrors.locationName ? "#ff4d4f" : "#d9d9d9" }}
//                   placeholder="e.g., Main Data Center"
//                   onFocus={e => e.target.style.borderColor="#1890ff"} onBlur={e => e.target.style.borderColor=formErrors.locationName?"#ff4d4f":"#d9d9d9"} />
//                 {errText(formErrors.locationName)}
//               </Col>
//             </Row>
//             <Row gutter={12} style={{ marginBottom: 14 }}>
//               <Col span={16}>
//                 <label style={lbl}>Street Address <span style={{ color: "#ff4d4f" }}>*</span></label>
//                 <input name="streetAddress" value={formData.streetAddress} onChange={handleInputChange}
//                   style={{ ...inputStyle, borderColor: formErrors.streetAddress ? "#ff4d4f" : "#d9d9d9" }}
//                   placeholder="e.g., 123 Main Street"
//                   onFocus={e => e.target.style.borderColor="#1890ff"} onBlur={e => e.target.style.borderColor=formErrors.streetAddress?"#ff4d4f":"#d9d9d9"} />
//                 {errText(formErrors.streetAddress)}
//               </Col>
//               <Col span={8}>
//                 <label style={lbl}>PIN Code <span style={{ color: "#ff4d4f" }}>*</span></label>
//                 <input name="pinCode" value={formData.pinCode} onChange={handleInputChange}
//                   style={{ ...inputStyle, borderColor: formErrors.pinCode ? "#ff4d4f" : "#d9d9d9" }}
//                   placeholder="e.g., 94105"
//                   onFocus={e => e.target.style.borderColor="#1890ff"} onBlur={e => e.target.style.borderColor=formErrors.pinCode?"#ff4d4f":"#d9d9d9"} />
//                 {errText(formErrors.pinCode)}
//               </Col>
//             </Row>
//             <Row gutter={12} style={{ marginBottom: 14 }}>
//               <Col span={12}>
//                 <label style={lbl}>Latitude <Text type="secondary" style={{ fontSize: 11 }}>(optional)</Text></label>
//                 <input name="latitude" value={formData.latitude} onChange={handleInputChange}
//                   style={{ ...inputStyle, borderColor: formErrors.latitude ? "#ff4d4f" : "#d9d9d9" }} placeholder="Range: -90 to 90"
//                   onFocus={e => e.target.style.borderColor="#1890ff"} onBlur={e => e.target.style.borderColor=formErrors.latitude?"#ff4d4f":"#d9d9d9"} />
//                 {errText(formErrors.latitude)}
//               </Col>
//               <Col span={12}>
//                 <label style={lbl}>Longitude <Text type="secondary" style={{ fontSize: 11 }}>(optional)</Text></label>
//                 <input name="longitude" value={formData.longitude} onChange={handleInputChange}
//                   style={{ ...inputStyle, borderColor: formErrors.longitude ? "#ff4d4f" : "#d9d9d9" }} placeholder="Range: -180 to 180"
//                   onFocus={e => e.target.style.borderColor="#1890ff"} onBlur={e => e.target.style.borderColor=formErrors.longitude?"#ff4d4f":"#d9d9d9"} />
//                 {errText(formErrors.longitude)}
//               </Col>
//             </Row>

           
//             {/* ── Floor Dimensions ── */}
//             <Divider style={{ margin: "4px 0 12px" }}>
//               <Space size={4}>
//                 <span style={{ fontSize: 13 }}>📐</span>
//                 <Text style={{ fontSize: 12 }} strong>Floor Dimensions</Text>
//                 <Text type="secondary" style={{ fontSize: 11 }}>Used for 5D Visualization</Text>
//               </Space>
//             </Divider>
//             <Row gutter={12} style={{ marginBottom: 14 }}>
//               <Col span={12}>
//                 <DimField label="Length" numField="dcLength" unitField="dcLengthUnit" />
//               </Col>
//               <Col span={12}>
//                 <DimField label="Breadth" numField="dcBreadth" unitField="dcBreadthUnit" />
//               </Col>
//             </Row>
//             {(formData.dcLength && formData.dcBreadth) && (
//               <div style={{ background: "linear-gradient(135deg,#e6f7ff,#f0f5ff)", border: "1px solid #91d5ff", borderRadius: 6, padding: "8px 12px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
//                 <EyeOutlined style={{ color: "#1890ff" }} />
//                 <Text style={{ fontSize: 12, color: "#0050b3" }}>
//                   Floor area: <strong>{formData.dcLength} {formData.dcLengthUnit} × {formData.dcBreadth} {formData.dcBreadthUnit}</strong>
//                   {" "}— 5D view will be available after saving.
//                 </Text>
//               </div>
//             )}

//             {/* ── Wall Margins with Units ── */}
//             <Divider style={{ margin: "4px 0 12px" }}>
//               <Space size={4}>
//                 <span style={{ fontSize: 13 }}>📏</span>
//                 <Text style={{ fontSize: 12 }} strong>Wall Margins</Text>
//                 <Text type="secondary" style={{ fontSize: 11 }}>For room placement in visualization</Text>
//               </Space>
//             </Divider>
            
//             {/* Margin Unit Selector */}
//             <Row gutter={12} style={{ marginBottom: 12 }}>
//               <Col span={6}>
//                 <label style={lbl}>Margin Unit</label>
//                 <Select
//                   value={formData.margins.unit || "m"}
//                   onChange={v => setFormData(prev => ({
//                     ...prev,
//                     margins: { ...prev.margins, unit: v }
//                   }))}
//                   size="small"
//                   style={{ width: "100%" }}
//                 >
//                   {MARGIN_UNITS.map(u => <Option key={u.value} value={u.value}>{u.label}</Option>)}
//                 </Select>
//               </Col>
//             </Row>

//             <Row gutter={12} style={{ marginBottom: 14 }}>
//               {["top","bottom","left","right"].map(side => (
//                 <Col span={6} key={side}>
//                   <label style={lbl}>{side.charAt(0).toUpperCase()+side.slice(1)} Margin</label>
//                   <InputNumber
//                     value={formData.margins[side]}
//                     onChange={v => setFormData(prev => ({
//                       ...prev,
//                       margins: { ...prev.margins, [side]: v || 0 }
//                     }))}
//                     size="small" 
//                     style={{ width: "100%" }}
//                     min={0} 
//                     max={20} 
//                     placeholder="2"
//                     addonAfter={formData.margins.unit || "m"}
//                   />
//                 </Col>
//               ))}
//             </Row>

//             {/* ── Contact Information ── */}
//             <Divider style={{ margin: "4px 0 12px" }}>
//               <Space size={4}><UserOutlined style={{ color: "#1890ff" }} /><Text style={{ fontSize: 12 }} strong>Contact Information</Text></Space>
//             </Divider>
//             <Row gutter={12} style={{ marginBottom: formData.contactPersonId ? 8 : 14 }}>
//               <Col span={24}>
//                 <label style={lbl}>Contact Person <span style={{ color: "#ff4d4f" }}>*</span></label>
//                 <Select value={formData.contactPersonId || undefined} onChange={handleContactChange}
//                   size="small" style={{ width: "100%" }} placeholder="Select contact person" showSearch optionFilterProp="children"
//                   status={formErrors.contactPersonId ? "error" : ""}>
//                   {usersList.map(u => (
//                     <Option key={u.id} value={u.id}>
//                       <Space size={4}><UserOutlined style={{ color: "#1890ff" }} /><Text strong>{u.name}</Text><Text type="secondary" style={{ fontSize: 11 }}>({u.role})</Text></Space>
//                     </Option>
//                   ))}
//                 </Select>
//                 {errText(formErrors.contactPersonId)}
//               </Col>
//             </Row>
//             {formData.contactPersonId && (
//               <div style={{ backgroundColor: "#f5f5f5", padding: "10px 14px", borderRadius: 4, marginBottom: 14 }}>
//                 <Row gutter={16}>
//                   <Col span={12}><Space size={4}><MailOutlined style={{ color: "#722ed1" }} /><Text style={{ fontSize: 12 }}>{formData.contactEmail}</Text></Space></Col>
//                   <Col span={12}><Space size={4}><PhoneOutlined style={{ color: "#52c41a" }} /><Text style={{ fontSize: 12 }}>{formData.contactPhone}</Text></Space></Col>
//                 </Row>
//               </div>
//             )}

//             {/* ── Status ── */}
//             <Row gutter={12} style={{ marginBottom: 14 }}>
//               <Col span={12}>
//                 <label style={lbl}>Status</label>
//                 <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
//                   <Switch checked={formData.status} onChange={checked => setFormData(prev => ({ ...prev, status: checked }))}
//                     checkedChildren="Active" unCheckedChildren="Inactive"
//                     style={{ backgroundColor: formData.status ? "#52c41a" : "#ff4d4f" }} />
//                   <Text style={{ fontSize: 12, color: formData.status ? "#52c41a" : "#ff4d4f", fontWeight: 500 }}>
//                     {formData.status ? "Active" : "Inactive"}
//                   </Text>
//                 </div>
//               </Col>
//             </Row>

//             <Divider style={{ margin: "12px 0" }} />
//             <div style={{ textAlign: "right" }}>
//               <Button onClick={closeModal} style={{ marginRight: 8 }}>Cancel</Button>
//               <Button type="primary" loading={loading} onClick={handleSubmit} icon={editingDC ? <EditOutlined /> : <PlusOutlined />}>
//                 {loading ? "Saving..." : editingDC ? "Update Data Center" : "Create Data Center"}
//               </Button>
//             </div>
//           </div>
//         </>
//       )}


//       {/* ══ DELETE MODAL ══ */}
//       {showDeleteModal && dcToDelete && (
//         <>
//           <div style={backdropStyle} onClick={closeDeleteModal} />
//           <div style={{ ...modalBoxStyle("480px"), textAlign: "center" }}>
//             <ExclamationCircleOutlined style={{ fontSize: 40, color: "#ff4d4f", marginBottom: 10 }} />
//             <h3 style={{ color: "#ff4d4f", marginBottom: 6 }}>Delete Data Center</h3>
//             <p style={{ fontSize: 14, marginBottom: 10 }}>Are you sure you want to delete this data center?</p>
//             <div style={{ backgroundColor: "#f5f5f5", padding: 12, borderRadius: 4, marginBottom: 12, textAlign: "left", fontSize: 13 }}>
//               {[
//                 ["Name",     dcToDelete.dataCenterName],
//                 ["Code",     dcToDelete.dataCenterCode],
//                 ["Tenant",   dcToDelete.tenantName],
//                 ["Location", dcToDelete.locationName],
//                 ["Address",  `${dcToDelete.streetAddress}, ${dcToDelete.cityName}, ${dcToDelete.countryName}`],
//                 ["Racks",    `${dcToDelete.utilizedRacks} / ${dcToDelete.totalRacks}`],
//                 ["Power",    `${dcToDelete.totalKW || dcToDelete.powerCapacity} ${dcToDelete.totalKWUnit || "kW"}`],
//                 ["Cooling",  `${dcToDelete.coolingCapacity} TR`],
//                 ["Contact",  dcToDelete.contactPersonName],
//                 ["Status",   dcToDelete.status],
//               ].map(([k, v]) => <p key={k} style={{ margin: "3px 0" }}><strong>{k}:</strong> {v}</p>)}
//             </div>
//             <p style={{ color: "#ff7875", fontSize: 12, marginBottom: 16 }}>This action cannot be undone.</p>
//             <Space>
//               <Button onClick={closeDeleteModal}>Cancel</Button>
//               <Button danger type="primary" onClick={handleDelete} icon={<DeleteOutlined />}>Delete Data Center</Button>
//             </Space>
//           </div>
//         </>
//       )}

//     </div>
//   );
// };

// export default AddDataCenter;





////=======================================================================================


// ============================= AddDataCenter.jsx =============================

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Table, Row, Col, Typography, Space, Button, Select,
  message, Input, Switch, Divider, Avatar, Tooltip, Badge,
  InputNumber, Progress, Upload, Radio,
} from "antd";
import {
  CloudServerOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
  MailOutlined, PhoneOutlined, GlobalOutlined, EnvironmentOutlined,
  CheckCircleOutlined, StopOutlined, PlusOutlined, SearchOutlined,
  ExclamationCircleOutlined, CloseOutlined, EyeOutlined,
  UserOutlined, ThunderboltOutlined, HeatMapOutlined, ApiOutlined,
  DashboardOutlined, CompassOutlined, UploadOutlined, FileOutlined,
  DeleteOutlined as RemoveFileIcon,
} from "@ant-design/icons";
import DxfParser from "dxf-parser";

import DataCenter3DView, { dcimBus } from "./Datacenter3dview";
// ── DEMO fixture (see idealDatacenterDemo.js for how to remove it) ──
import { IDEAL_DC, IDEAL_ROOMS } from "./idealDatacenterDemo";
import { DCIM } from "../Component/MainDashboard/dcimDashboardData";

// The demo row as this list shows it: its rack, power and cooling figures are
// read from what its 5D View floor actually holds (the 5D View itself never
// reads these fields) — 46 racks, all in use; the rooms' 490 kW power budget;
// 6 PAC units × 30 kW = 180 kW of cooling, shown here in tons (TR).
const IDEAL_DC_LISTED = {
  ...IDEAL_DC,
  totalRacks: DCIM.racksTotal,
  utilizedRacks: DCIM.racksTotal,
  totalKW: DCIM.facilityBudgetKw,
  powerCapacity: DCIM.facilityBudgetKw,
  coolingCapacity: Math.round(DCIM.coolingCapKw / 3.517),
};

const { Title, Text } = Typography;
const { Option } = Select;

// ── unit options ──────────────────────────────────────────────────────────
const DIMENSION_UNITS = [
  { value: "m",  label: "m"  },
  { value: "mm", label: "mm" },
  { value: "ft", label: "ft" },
  { value: "yd", label: "yd" },
  { value: "km", label: "km" },
];

// ── Power unit options ──────────────────────────────────────────────────
const POWER_UNITS = [
  { value: "kW", label: "kW" },
  { value: "MW", label: "MW" },
  { value: "BTU/h", label: "BTU/h" },
  { value: "Tons", label: "Tons (Refrigeration)" },
  { value: "kVA", label: "kVA" },
  { value: "HP", label: "HP" },
];

// ── NEW: Door direction / position options ──────────────────────────────
const DOOR_DIRECTIONS = [
  { value: "North", label: "North (Top wall)" },
  { value: "South", label: "South (Bottom wall)" },
  { value: "East",  label: "East (Right wall)"  },
  { value: "West",  label: "West (Left wall)"   },
];
const DOOR_POSITIONS = [
  { value: "start",  label: "Start (Left / Top edge)" },
  { value: "center", label: "Center" },
  { value: "end",    label: "End (Right / Bottom edge)" },
];

// ── NEW: DXF unit code -> metres conversion (per DXF group code 70 / $INSUNITS) ─
const DXF_INSUNITS_TO_M = {
  0: 0.001, 1: 0.0254, 2: 0.3048, 4: 0.001, 5: 0.01, 6: 1, 8: 0.3048006096,
};

// ── NEW: Extract every point from every entity type dxf-parser exposes ───
function collectDxfPoints(dxf) {
  const pts = [];
  const pushPt = (p) => { if (p && typeof p.x === "number" && typeof p.y === "number") pts.push(p); };

  (dxf.entities || []).forEach((e) => {
    switch (e.type) {
      case "LINE":
        pushPt(e.vertices?.[0]); pushPt(e.vertices?.[1]);
        break;
      case "LWPOLYLINE":
      case "POLYLINE":
        (e.vertices || []).forEach(pushPt);
        break;
      case "CIRCLE":
      case "ARC":
        if (e.center && typeof e.radius === "number") {
          pushPt({ x: e.center.x - e.radius, y: e.center.y - e.radius });
          pushPt({ x: e.center.x + e.radius, y: e.center.y + e.radius });
        }
        break;
      case "SPLINE":
        (e.controlPoints || []).forEach(pushPt);
        break;
      case "INSERT":
        pushPt(e.position);
        break;
      default:
        (e.vertices || []).forEach(pushPt);
        break;
    }
  });
  return pts;
}

// ── NEW: Parse a DXF file's raw text -> { entities, widthM, lengthM, insUnits } ─
function parseDxfText(text) {
  const parser = new DxfParser();
  const dxf = parser.parseSync(text);
  if (!dxf) throw new Error("Could not parse DXF — file may be corrupt or an unsupported DXF version.");

  const points = collectDxfPoints(dxf);
  if (!points.length) throw new Error("No drawable geometry (lines/polylines/arcs) found in this DXF.");

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);

  const insUnitsCode = dxf.header?.$INSUNITS ?? 0;
  const unitToM = DXF_INSUNITS_TO_M[insUnitsCode] ?? 0.001;

  const widthM = (maxX - minX) * unitToM;   // East–West
  const lengthDxfM = (maxY - minY) * unitToM; // North–South

  // Keep only lightweight, renderable entities for the 3D overlay.
  const entities = (dxf.entities || [])
    .filter((e) => ["LINE", "LWPOLYLINE", "POLYLINE", "CIRCLE", "ARC"].includes(e.type))
    .map((e) => ({
      type: e.type,
      vertices: e.vertices?.map((v) => ({ x: v.x - minX, y: v.y - minY })) || [],
      center: e.center ? { x: e.center.x - minX, y: e.center.y - minY } : undefined,
      radius: e.radius,
      startAngle: e.startAngle,
      endAngle: e.endAngle,
      closed: !!e.shape || !!e.closed,
    }))
    .slice(0, 20000); // safety cap so huge drawings don't choke the renderer

  return {
    entities,
    widthM,          // E–W footprint, metres
    lengthM: lengthDxfM, // N–S footprint, metres
    insUnitsCode,
  };
}

const AddDataCenter = () => {
  const [loading, setLoading]               = useState(false);
  const [showModal, setShowModal]           = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dcToDelete, setDcToDelete]         = useState(null);
  const [editingDC, setEditingDC]           = useState(null);
  const [show3DView, setShow3DView]         = useState(false);
  const [viewing3DDC, setViewing3DDC]       = useState(null);
  const [viewer3DTheme, setViewer3DTheme]   = useState("light");
  const [sortedInfo, setSortedInfo]         = useState({ columnKey: "id", order: "ascend" });
  const [searchText, setSearchText]         = useState("");
  const [countryFilter, setCountryFilter]   = useState("all");
  const [statusFilter, setStatusFilter]     = useState("all");
  const [availableStates, setAvailableStates] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [availableSites, setAvailableSites]   = useState([]);
  const [dcRooms, setDcRooms]               = useState({}); // { [dcId]: room[] }

  // ── NEW: CAD import state ────────────────────────────────────────────
  const [dxfUploading, setDxfUploading]     = useState(false);
  const [dxfFileInfo, setDxfFileInfo]       = useState(null); // { name, entityCount, widthM, lengthM }

  // ── Keep dcRooms in sync with Toolbox / 3D view drag-drop & add/delete room events ──
  useEffect(() => {
    const genId = () => Date.now() + Math.floor(Math.random() * 1000);

    const offAdd = dcimBus.on("addRoom", (e) => {
      const room = e.detail;
      if (!viewing3DDC) return; // no 3D view open, ignore
      setDcRooms((prev) => {
        const list = prev[viewing3DDC.id] || [];
        const newRoom = {
          id: room.id || genId(),
          margins: { top: 1, bottom: 1, left: 1, right: 1 },
          ...room,
          color: room.hex || room.color || "#3498db",
          typeLabel: room.typeLabel || room.type,
        };
        return { ...prev, [viewing3DDC.id]: [...list, newRoom] };
      });
    });

    const offDelete = dcimBus.on("deleteRoom", (e) => {
      const { id } = e.detail;
      if (!viewing3DDC) return;
      setDcRooms((prev) => ({
        ...prev,
        [viewing3DDC.id]: (prev[viewing3DDC.id] || []).filter((r) => r.id !== id),
      }));
    });

    const offUpdate = dcimBus.on("updateRoom", (e) => {
      const { id, posX, posZ, width, length } = e.detail;
      if (!viewing3DDC) return;
      setDcRooms((prev) => ({
        ...prev,
        [viewing3DDC.id]: (prev[viewing3DDC.id] || []).map((r) => {
          if (r.id !== id) return r;
          return {
            ...r,
            posX, posZ,
            ...(width != null ? { width } : {}),
            ...(length != null ? { length } : {}),
          };
        }),
      }));
    });

    const offZoom = dcimBus.on("zoomRoom", (e) => {});

    return () => {
      offAdd();
      offDelete();
      offUpdate();
      offZoom();
    };
  }, [viewing3DDC]);

  // ── Reference Data ────────────────────────────────────────────────────────
  const tenantsList = [
    { id:1, name:"Acme Corporation",  code:"ACME", type:"Enterprise" },
    { id:2, name:"TechGlobal Inc",    code:"TGI",  type:"Enterprise" },
    { id:3, name:"CloudServe",        code:"CS",   type:"Service Provider" },
    { id:4, name:"DataBank",          code:"DB",   type:"Colocation" },
    { id:5, name:"NetSolutions",      code:"NS",   type:"Enterprise" },
  ];
  const countriesList = [
    { id:1, name:"United States", code:"USA" },
    { id:3, name:"India",         code:"IND" },
    { id:6, name:"Canada",        code:"CAN" },
    { id:8, name:"Singapore",     code:"SGP" },
  ];
  const statesList = [
    { id:1,  name:"California",     code:"CA", countryId:1 },
    { id:2,  name:"Texas",          code:"TX", countryId:1 },
    { id:4,  name:"Virginia",       code:"VA", countryId:1 },
    { id:5,  name:"Ontario",        code:"ON", countryId:6 },
    { id:8,  name:"Maharashtra",    code:"MH", countryId:3 },
    { id:9,  name:"Karnataka",      code:"KA", countryId:3 },
    { id:17, name:"Central Region", code:"CR", countryId:8 },
  ];
  const citiesList = [
    { id:1,  name:"Los Angeles",   code:"LAX", stateId:1,  countryId:1 },
    { id:2,  name:"San Francisco", code:"SFO", stateId:1,  countryId:1 },
    { id:9,  name:"Ashburn",       code:"IAD", stateId:4,  countryId:1 },
    { id:11, name:"Toronto",       code:"YYZ", stateId:5,  countryId:6 },
    { id:15, name:"Mumbai",        code:"BOM", stateId:8,  countryId:3 },
    { id:17, name:"Bangalore",     code:"BLR", stateId:9,  countryId:3 },
    { id:26, name:"Singapore",     code:"SIN", stateId:17, countryId:8 },
  ];
  const sitesList = [
    { id:1,  name:"Building A",       code:"BLD-A", cityId:1  },
    { id:3,  name:"Building C",       code:"BLD-C", cityId:2  },
    { id:10, name:"Campus A",         code:"CA",    cityId:9  },
    { id:12, name:"Core Building",    code:"CORE",  cityId:11 },
    { id:14, name:"DC Building",      code:"DCB",   cityId:15 },
    { id:15, name:"Hub 1",            code:"H1",    cityId:17 },
    { id:19, name:"Singapore Site 1", code:"SGS1",  cityId:26 },
  ];
  const usersList = [
    { id:1, name:"John Smith",   email:"john.smith@datacenter.com",  phone:"+1 213 555 1234",  role:"Facility Manager" },
    { id:2, name:"Jane Doe",     email:"jane.doe@datacenter.com",    phone:"+1 415 555 5678",  role:"Operations Lead"  },
    { id:3, name:"Mike Wilson",  email:"mike.wilson@datacenter.ca",  phone:"+1 416 555 9012",  role:"Site Supervisor"  },
    { id:4, name:"Rajesh Kumar", email:"rajesh.kumar@datacenter.in", phone:"+91 22 5555 1234", role:"DC Manager"       },
    { id:5, name:"Sarah Tan",    email:"sarah.tan@datacenter.sg",    phone:"+65 6789 0123",    role:"Regional Head"    },
  ];

  const emptyForm = {
    dataCenterName:"", dataCenterCode:"", countryId:"", stateId:"", cityId:"",
    locationName:"", streetAddress:"", pinCode:"", latitude:"", longitude:"",
    siteId:"", tenantId:"", totalRacks:"", utilizedRacks:"",
    powerCapacity:"", coolingCapacity:"", contactPersonId:"",
    contactEmail:"", contactPhone:"", status: true,
    // ── dimensions ──
    dcLength:"", dcLengthUnit:"m", dcBreadth:"", dcBreadthUnit:"m",
    totalKW: "", totalKWUnit: "kW",
    margins: { top: 2, bottom: 2, left: 2, right: 2, unit: "m" },
    // ── door placement ──
    doorDirection: "South",
    doorPosition: "center",
    // ── NEW: Floor setup mode — "manual" (type L×B) or "dxf" (import CAD) ──
    dcSetupMode: "manual",
    // ── NEW: CAD import ──
    dxfFileName: "",
    dxfEntities: null,
  };
  const emptyErrors = Object.fromEntries(Object.keys(emptyForm).map(k => [k, ""]));

  const [formData, setFormData]     = useState(emptyForm);
  const [formErrors, setFormErrors] = useState(emptyErrors);

  const [dataCenters, setDataCenters] = useState([
    // ── DEMO row: the reference "ideal datacenter" showcase ──
    // Pinned first so it is the obvious thing to click. Remove this one line
    // (and the IDEAL_* import above) to take the demo out.
    IDEAL_DC_LISTED,
    { id:1, dataCenterName:"LAX1 - Main Facility", dataCenterCode:"LAX-MAIN-01", countryId:1, countryName:"United States", stateId:1, stateName:"California", cityId:1, cityName:"Los Angeles", locationName:"Main Data Center", streetAddress:"123 Main Street", pinCode:"90001", latitude:"34.0522", longitude:"-118.2437", siteId:1, siteName:"Building A", tenantId:1, tenantName:"Acme Corporation", totalRacks:500, utilizedRacks:325, powerCapacity:2500, coolingCapacity:750, contactPersonId:1, contactPersonName:"John Smith", contactEmail:"john.smith@datacenter.com", contactPhone:"+1 213 555 1234", status:"Active", createdDate:"2024-01-15", dcLength:40, dcLengthUnit:"km", dcBreadth:25, dcBreadthUnit:"km", totalKW:2000, totalKWUnit:"kW", margins:{top:2,bottom:2,left:2,right:2,unit:"m"}, doorDirection:"South", doorPosition:"center" },
    { id:2, dataCenterName:"SFO - Edge Facility",  dataCenterCode:"SFO-EDGE-02", countryId:1, countryName:"United States", stateId:1, stateName:"California", cityId:2, cityName:"San Francisco", locationName:"Edge Facility - West", streetAddress:"456 Market Street", pinCode:"94105", latitude:"37.7749", longitude:"-122.4194", siteId:3, siteName:"Building C", tenantId:2, tenantName:"TechGlobal Inc", totalRacks:250, utilizedRacks:180, powerCapacity:1200, coolingCapacity:350, contactPersonId:2, contactPersonName:"Jane Doe", contactEmail:"jane.doe@datacenter.com", contactPhone:"+1 415 555 5678", status:"Active", createdDate:"2024-02-20", dcLength:80, dcLengthUnit:"km", dcBreadth:50, dcBreadthUnit:"km", totalKW:1000, totalKWUnit:"kW", margins:{top:2,bottom:2,left:2,right:2,unit:"m"}, doorDirection:"East", doorPosition:"start" },
    { id:3, dataCenterName:"TOR - Core Facility",  dataCenterCode:"TOR-CORE-03", countryId:6, countryName:"Canada", stateId:5, stateName:"Ontario", cityId:11, cityName:"Toronto", locationName:"Toronto Core", streetAddress:"789 Bay Street", pinCode:"M5G 2C8", latitude:"43.6532", longitude:"-79.3832", siteId:12, siteName:"Core Building", tenantId:3, tenantName:"CloudServe", totalRacks:400, utilizedRacks:220, powerCapacity:2000, coolingCapacity:600, contactPersonId:3, contactPersonName:"Mike Wilson", contactEmail:"mike.wilson@datacenter.ca", contactPhone:"+1 416 555 9012", status:"Active", createdDate:"2024-03-10", dcLength:35, dcLengthUnit:"km", dcBreadth:20, dcBreadthUnit:"km", totalKW:1500, totalKWUnit:"kW", margins:{top:2,bottom:2,left:2,right:2,unit:"m"}, doorDirection:"North", doorPosition:"end" },
    { id:4, dataCenterName:"MUM - DR Site",        dataCenterCode:"MUM-DR-04",   countryId:3, countryName:"India", stateId:8, stateName:"Maharashtra", cityId:15, cityName:"Mumbai", locationName:"Mumbai DC", streetAddress:"321 Business Park", pinCode:"400001", latitude:"19.0760", longitude:"72.8777", siteId:14, siteName:"DC Building", tenantId:4, tenantName:"DataBank", totalRacks:150, utilizedRacks:75, powerCapacity:800, coolingCapacity:200, contactPersonId:4, contactPersonName:"Rajesh Kumar", contactEmail:"rajesh.kumar@datacenter.in", contactPhone:"+91 22 5555 1234", status:"Maintenance", createdDate:"2024-04-05", dcLength:20, dcLengthUnit:"km", dcBreadth:15, dcBreadthUnit:"km", totalKW:600, totalKWUnit:"kW", margins:{top:2,bottom:2,left:2,right:2,unit:"m"}, doorDirection:"South", doorPosition:"center" },
    { id:5, dataCenterName:"SIN - Hub Facility",   dataCenterCode:"SIN-HUB-05",  countryId:8, countryName:"Singapore", stateId:17, stateName:"Central Region", cityId:26, cityName:"Singapore", locationName:"Singapore Hub", streetAddress:"1 Raffles Place", pinCode:"048616", latitude:"1.2843", longitude:"103.8510", siteId:19, siteName:"Singapore Site 1", tenantId:5, tenantName:"NetSolutions", totalRacks:300, utilizedRacks:290, powerCapacity:1500, coolingCapacity:450, contactPersonId:5, contactPersonName:"Sarah Tan", contactEmail:"sarah.tan@datacenter.sg", contactPhone:"+65 6789 0123", status:"Warning", createdDate:"2024-05-12", dcLength:30, dcLengthUnit:"km", dcBreadth:22, dcBreadthUnit:"km", totalKW:1200, totalKWUnit:"kW", margins:{top:2,bottom:2,left:2,right:2,unit:"m"}, doorDirection:"West", doorPosition:"center" },
  ]);

  // ── Computed ──────────────────────────────────────────────────────────────
  const totalCount       = dataCenters.length;
  const activeCount      = dataCenters.filter(d => d.status === "Active").length;
  const maintenanceCount = dataCenters.filter(d => d.status === "Maintenance").length;
  const warningCount     = dataCenters.filter(d => d.status === "Warning").length;
  const totalRacksCap    = dataCenters.reduce((s, d) => s + (d.totalRacks || 0), 0);
  const totalRacksUsed   = dataCenters.reduce((s, d) => s + (d.utilizedRacks || 0), 0);
  const uniqueCountries  = [...new Map(dataCenters.map(d => [d.countryId, { id: d.countryId, name: d.countryName }])).values()];

  const filteredDCs = dataCenters.filter(d => {
    const q = searchText.toLowerCase();
    const matchSearch  = !searchText || d.dataCenterName.toLowerCase().includes(q) || d.dataCenterCode.toLowerCase().includes(q) || d.locationName.toLowerCase().includes(q) || d.cityName.toLowerCase().includes(q) || d.countryName.toLowerCase().includes(q);
    const matchCountry = countryFilter === "all" || d.countryId === countryFilter;
    const matchStatus  = statusFilter  === "all" || d.status === statusFilter;
    return matchSearch && matchCountry && matchStatus;
  });

  // ── Validation ────────────────────────────────────────────────────────────
  const validators = {
    dataCenterName:  v => !v ? "Required" : v.length < 3 ? "Min 3 chars" : "",
    dataCenterCode:  v => !v ? "Required" : !/^[A-Z0-9-]+$/i.test(v) ? "Alphanumeric & hyphens only" : "",
    countryId:       v => !v ? "Select a country" : "",
    stateId:         v => !v ? "Select a state"   : "",
    cityId:          v => !v ? "Select a city"    : "",
    locationName:    v => !v ? "Required" : "",
    streetAddress:   v => !v ? "Required" : "",
    pinCode:         v => !v ? "Required" : "",
    siteId:          v => !v ? "Select a site"   : "",
    tenantId:        v => !v ? "Select a tenant" : "",
    totalRacks:      v => (v === "" || v === null || v === undefined) ? "" : v < 0 ? "Must be ≥ 0" : "",
    utilizedRacks:   v => (v === "" || v === null || v === undefined) ? "" : v < 0 ? "Must be ≥ 0" : "",
    powerCapacity:   v => (v === "" || v === null || v === undefined) ? "" : v < 0 ? "Must be ≥ 0" : "",
    coolingCapacity: v => (v === "" || v === null || v === undefined) ? "" : v < 0 ? "Must be ≥ 0" : "",
    contactPersonId: v => !v ? "Select a contact person" : "",
    latitude:        v => !v ? "" : isNaN(v) || v < -90  || v > 90  ? "Range -90 to 90"   : "",
    longitude:       v => !v ? "" : isNaN(v) || v < -180 || v > 180 ? "Range -180 to 180" : "",
    dcLength:        v => (v === "" || v === null || v === undefined) ? "" : v <= 0 ? "Must be > 0" : "",
    dcBreadth:       v => (v === "" || v === null || v === undefined) ? "" : v <= 0 ? "Must be > 0" : "",
    totalKW:         v => (v === "" || v === null || v === undefined) ? "" : v < 0 ? "Must be ≥ 0" : "",
  };
  const validateAll = () => {
    const errs = Object.fromEntries(Object.keys(validators).map(k => [k, validators[k](formData[k])]));
    // NEW: in DXF mode, Length/Breadth come from the parsed file — don't block submit on them.
    if (formData.dcSetupMode === "dxf") {
      errs.dcLength = "";
      errs.dcBreadth = "";
    }
    setFormErrors(prev => ({ ...prev, ...errs }));
    return Object.values(errs).every(e => !e);
  };
  const setErr = (field, val) => setFormErrors(prev => ({ ...prev, [field]: validators[field]?.(val) ?? "" }));

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleInputChange  = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); setErr(name, value); };
  const handleNumberChange = (name, value) => { setFormData(prev => ({ ...prev, [name]: value })); setErr(name, value); };
  const handleSelectChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  // ── NEW: Floor setup mode toggle (Manual ↔ DXF import) ──────────────────
  const handleSetupModeChange = (mode) => {
    setFormData(prev => ({
      ...prev,
      dcSetupMode: mode,
      // switching to manual: drop any imported CAD data so it doesn't linger
      ...(mode === "manual" ? { dxfFileName: "", dxfEntities: null } : {}),
      // switching to dxf: clear manually typed dimensions so DXF import fills them fresh
      ...(mode === "dxf" ? { dcLength: "", dcBreadth: "" } : {}),
    }));
    setFormErrors(prev => ({ ...prev, dcLength: "", dcBreadth: "" }));
    if (mode === "manual") setDxfFileInfo(null);
  };

  // ── Power unit conversion helper ────────────────────────────────────────
  const convertPowerValue = (value, fromUnit, toUnit) => {
    if (!value || value === "" || value === null || value === undefined) return null;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return null;
    const toKW = { "kW": 1, "MW": 1000, "BTU/h": 0.000293071, "Tons": 3.517, "kVA": 0.8, "HP": 0.7457 };
    const inKW = numValue * (toKW[fromUnit] || 1);
    const fromKW = { "kW": 1, "MW": 1/1000, "BTU/h": 1/0.000293071, "Tons": 1/3.517, "kVA": 1/0.8, "HP": 1/0.7457 };
    return inKW * (fromKW[toUnit] || 1);
  };

  // ── Auto-calculate power capacity when totalKW changes ──────────────
  const handlePowerChange = (value, unit) => {
    setFormData(prev => ({ ...prev, totalKW: value, totalKWUnit: unit || prev.totalKWUnit }));
    if (value && value > 0 && unit) {
      const kWValue = convertPowerValue(value, unit, "kW");
      if (kWValue !== null) {
        const powerCap = Math.round(kWValue * 1.2);
        const coolingCap = Math.round(kWValue * 0.35);
        setFormData(prev => ({ ...prev, powerCapacity: powerCap, coolingCapacity: coolingCap }));
      }
    }
  };

  const handleCountryChange = (v) => {
    setAvailableStates(statesList.filter(s => s.countryId === v));
    setAvailableCities([]); setAvailableSites([]);
    setFormData(prev => ({ ...prev, countryId: v, stateId: "", cityId: "", siteId: "" }));
    setFormErrors(prev => ({ ...prev, countryId: "", stateId: "", cityId: "", siteId: "" }));
  };
  const handleStateChange = (v) => {
    setAvailableCities(citiesList.filter(c => c.stateId === v));
    setAvailableSites([]);
    setFormData(prev => ({ ...prev, stateId: v, cityId: "", siteId: "" }));
    setFormErrors(prev => ({ ...prev, stateId: "", cityId: "", siteId: "" }));
  };
  const handleCityChange = (v) => {
    setAvailableSites(sitesList.filter(s => s.cityId === v));
    setFormData(prev => ({ ...prev, cityId: v, siteId: "" }));
    setFormErrors(prev => ({ ...prev, cityId: "", siteId: "" }));
  };
  const handleContactChange = (v) => {
    const u = usersList.find(x => x.id === v);
    setFormData(prev => ({ ...prev, contactPersonId: v, contactEmail: u?.email || "", contactPhone: u?.phone || "" }));
    setErr("contactPersonId", v);
  };

  // ── NEW: DXF / DWG upload handler ────────────────────────────────────
  const handleCadFile = async (file) => {
    const isDwg = /\.dwg$/i.test(file.name);
    const isDxf = /\.dxf$/i.test(file.name);

    if (isDwg) {
      message.error(
        "DWG can't be read in the browser (it's a closed Autodesk binary format). Open it in AutoCAD / DraftSight and use \"Save As → DXF (ASCII)\", then upload the .dxf here."
      );
      return Upload.LIST_IGNORE;
    }
    if (!isDxf) {
      message.error("Only .dxf files are supported for CAD import.");
      return Upload.LIST_IGNORE;
    }

    setDxfUploading(true);
    try {
      const text = await file.text();
      const parsed = parseDxfText(text);

      if (!parsed.widthM || !parsed.lengthM || parsed.widthM <= 0 || parsed.lengthM <= 0) {
        throw new Error("Couldn't determine a valid floor footprint from this DXF's geometry.");
      }

      setFormData(prev => ({
        ...prev,
        dxfFileName: file.name,
        dxfEntities: parsed.entities,
        dcLength: Number(parsed.widthM.toFixed(3)),
        dcLengthUnit: "m",
        dcBreadth: Number(parsed.lengthM.toFixed(3)),
        dcBreadthUnit: "m",
      }));
      setFormErrors(prev => ({ ...prev, dcLength: "", dcBreadth: "" }));
      setDxfFileInfo({
        name: file.name,
        entityCount: parsed.entities.length,
        widthM: parsed.widthM,
        lengthM: parsed.lengthM,
      });
      message.success(
        `"${file.name}" imported — floor set to ${parsed.widthM.toFixed(2)}m × ${parsed.lengthM.toFixed(2)}m from ${parsed.entities.length} CAD entities.`
      );
    } catch (err) {
      console.error(err);
      message.error(`Couldn't read this DXF: ${err.message || "unknown parsing error"}`);
    } finally {
      setDxfUploading(false);
    }
    return Upload.LIST_IGNORE; // we manage our own file state, not antd's internal list
  };

  const clearCadFile = () => {
    setFormData(prev => ({ ...prev, dxfFileName: "", dxfEntities: null, dcLength: "", dcBreadth: "" }));
    setDxfFileInfo(null);
  };

  const openAddModal = () => {
    setEditingDC(null); setFormData(emptyForm); setFormErrors(emptyErrors);
    setAvailableStates([]); setAvailableCities([]); setAvailableSites([]);
    setDxfFileInfo(null);
    setShowModal(true);
  };
  const openEditModal = (dc) => {
    setEditingDC(dc);
    setAvailableStates(statesList.filter(s => s.countryId === dc.countryId));
    setAvailableCities(citiesList.filter(c => c.stateId === dc.stateId));
    setAvailableSites(sitesList.filter(s => s.cityId === dc.cityId));
    setFormData({
      dataCenterName: dc.dataCenterName, dataCenterCode: dc.dataCenterCode,
      countryId: dc.countryId, stateId: dc.stateId, cityId: dc.cityId,
      locationName: dc.locationName, streetAddress: dc.streetAddress,
      pinCode: dc.pinCode, latitude: dc.latitude, longitude: dc.longitude,
      siteId: dc.siteId, tenantId: dc.tenantId,
      totalRacks: dc.totalRacks, utilizedRacks: dc.utilizedRacks,
      powerCapacity: dc.powerCapacity, coolingCapacity: dc.coolingCapacity,
      contactPersonId: dc.contactPersonId, contactEmail: dc.contactEmail, contactPhone: dc.contactPhone,
      status: dc.status === "Active",
      dcLength: dc.dcLength || "", dcLengthUnit: dc.dcLengthUnit || "m",
      dcBreadth: dc.dcBreadth || "", dcBreadthUnit: dc.dcBreadthUnit || "m",
      totalKW: dc.totalKW || "",
      totalKWUnit: dc.totalKWUnit || "kW",
      margins: dc.margins || { top: 2, bottom: 2, left: 2, right: 2, unit: "m" },
      doorDirection: dc.doorDirection || "South",
      doorPosition: dc.doorPosition || "center",
      // NEW: infer setup mode from whether this DC was originally created via DXF
      dcSetupMode: dc.dxfFileName ? "dxf" : "manual",
      dxfFileName: dc.dxfFileName || "",
      dxfEntities: dc.dxfEntities || null,
    });
    setFormErrors(emptyErrors);
    setDxfFileInfo(dc.dxfFileName ? { name: dc.dxfFileName, entityCount: (dc.dxfEntities || []).length } : null);
    setShowModal(true);
  };

  // ── Open the 5D view INLINE (no route navigation) ──────────────────────
  const open3DView = (dc) => {
    // The demo row ships with its own rooms, so the viewer opens straight
    // onto a finished floor instead of an empty shell.
    if (dc?.isDemo && !dcRooms[dc.id]) {
      setDcRooms((prev) => ({ ...prev, [dc.id]: IDEAL_ROOMS }));
    }
    setViewing3DDC(dc);
    setShow3DView(true);
  };
  const close3DView = () => {
    setShow3DView(false);
    setViewing3DDC(null);
  };

  const openDeleteModal  = (dc) => { setDcToDelete(dc); setShowDeleteModal(true); };
  const closeModal       = () => { setShowModal(false); setEditingDC(null); setDxfFileInfo(null); };
  const closeDeleteModal = () => { setShowDeleteModal(false); setDcToDelete(null); };

  const handleDelete = () => {
    if (dcToDelete) {
      setDataCenters(dataCenters.filter(d => d.id !== dcToDelete.id));
      message.success("Data center deleted!");
      closeDeleteModal();
    }
  };

  const handleSubmit = () => {
    if (!validateAll()) { message.error("Please fix the errors in the form"); return; }
    if (formData.dcSetupMode === "dxf" && !formData.dxfEntities) {
      message.error("Please upload a DXF floor plan, or switch to Manual Entry.");
      return;
    }
    setLoading(true);
    const country = countriesList.find(c => c.id === formData.countryId);
    const state   = statesList.find(s => s.id === formData.stateId);
    const city    = citiesList.find(c => c.id === formData.cityId);
    const site    = sitesList.find(s => s.id === formData.siteId);
    const tenant  = tenantsList.find(t => t.id === formData.tenantId);
    const contact = usersList.find(u => u.id === formData.contactPersonId);
    setTimeout(() => {
      let totalKWValue = parseFloat(formData.totalKW) || 0;
      let totalKWUnit = formData.totalKWUnit || "kW";
      if (totalKWUnit !== "kW" && totalKWValue > 0) {
        const kWValue = convertPowerValue(totalKWValue, totalKWUnit, "kW");
        if (kWValue !== null) { totalKWValue = kWValue; totalKWUnit = "kW"; }
      }
      const payload = {
        ...formData,
        dataCenterCode: formData.dataCenterCode.toUpperCase(),
        countryName: country?.name || "", stateName: state?.name || "",
        cityName: city?.name || "", siteName: site?.name || "",
        tenantName: tenant?.name || "", contactPersonName: contact?.name || "",
        totalRacks: parseInt(formData.totalRacks) || 0,
        utilizedRacks: parseInt(formData.utilizedRacks) || 0,
        powerCapacity: parseInt(formData.powerCapacity) || 0,
        coolingCapacity: parseInt(formData.coolingCapacity) || 0,
        status: formData.status ? "Active" : "Inactive",
        dcLength: parseFloat(formData.dcLength) || 0,
        dcBreadth: parseFloat(formData.dcBreadth) || 0,
        totalKW: totalKWValue,
        totalKWUnit: totalKWUnit,
        margins: formData.margins || { top:2, bottom:2, left:2, right:2, unit:"m" },
        doorDirection: formData.doorDirection || "South",
        doorPosition: formData.doorPosition || "center",
        // NEW: only persist DXF data when the user actually chose DXF mode
        dxfFileName: formData.dcSetupMode === "dxf" ? (formData.dxfFileName || "") : "",
        dxfEntities: formData.dcSetupMode === "dxf" ? (formData.dxfEntities || null) : null,
      };
      if (editingDC) {
        setDataCenters(dataCenters.map(d => d.id === editingDC.id ? { ...d, ...payload } : d));
        message.success("Data center updated!");
      } else {
        const newDC = { id: Date.now(), ...payload, createdDate: new Date().toISOString().split("T")[0] };
        setDataCenters([...dataCenters, newDC]);
        message.success("Data center added!");
      }
      setLoading(false); closeModal();
    }, 500);
  };

  const handleTableChange = (_, __, sorter) => setSortedInfo(sorter);

  // ── Stat Card ─────────────────────────────────────────────────────────────
  const StatCard = ({ label, value, color, icon }) => (
    <div style={{ backgroundColor: "white", borderRadius: 6, padding: "8px 14px", borderTop: `3px solid ${color}`, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 22, color }}>{icon}</span>
      <div>
        <div style={{ fontSize: 11, color: "#888", lineHeight: 1.3 }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
      </div>
    </div>
  );

  // ── Shared style tokens ───────────────────────────────────────────────────
  const backdropStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000 };
  const modalBoxStyle = (w) => ({ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", backgroundColor: "white", padding: "20px", borderRadius: "8px", width: w, maxWidth: "95%", maxHeight: "92vh", overflowY: "auto", zIndex: 1001, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" });
  const lbl     = { display: "block", marginBottom: 4, fontWeight: 500, fontSize: 13 };
  const errText = (msg) => msg ? <Text type="danger" style={{ fontSize: 11, marginTop: 2, display: "block" }}>{msg}</Text> : null;
  const inputStyle = { width: "100%", padding: "5px 10px", border: "1px solid #d9d9d9", borderRadius: 6, fontSize: 13, boxSizing: "border-box", outline: "none", fontFamily: "inherit" };

  const statusBadge = (s) => {
    const map = { Active: "success", Maintenance: "warning", Warning: "error", Inactive: "default" };
    return <Badge status={map[s] || "default"} text={<span style={{ fontSize: 11 }}>{s}</span>} />;
  };
  const dcAvatarColor = (s) => s === "Active" ? "#1890ff" : s === "Warning" ? "#faad14" : s === "Maintenance" ? "#722ed1" : "#d9d9d9";
  const utilPct = (used, total) => total ? Math.round((used / total) * 100) : 0;

  // ── Dimension field helper (now with compass direction label) ──────────
  const DimField = ({ label, direction, numField, unitField }) => (
    <div>
      <label style={lbl}>
        {label}{" "}
        <Text type="secondary" style={{ fontSize: 11 }}>
          ({direction}) · optional
        </Text>
      </label>
      <Input.Group compact>
        <InputNumber
          value={formData[numField]}
          onChange={v => handleNumberChange(numField, v)}
          size="small"
          placeholder="e.g., 40"
          min={0}
          style={{ width: "calc(100% - 72px)" }}
          status={formErrors[numField] ? "error" : ""}
        />
        <Select
          value={formData[unitField]}
          onChange={v => handleSelectChange(unitField, v)}
          size="small"
          style={{ width: 72 }}
        >
          {DIMENSION_UNITS.map(u => <Option key={u.value} value={u.value}>{u.label}</Option>)}
        </Select>
      </Input.Group>
      {errText(formErrors[numField])}
    </div>
  );

  // ── Select helper ─────────────────────────────────────────────────────────
  const fldSelect = (field, label, opts, required, placeholder, disabled, hint) => (
    <div>
      <label style={lbl}>{label}{required && <span style={{ color: "#ff4d4f" }}> *</span>}</label>
      <Select
        value={formData[field] || undefined}
        onChange={v => { setFormData(prev => ({ ...prev, [field]: v })); setErr(field, v); }}
        size="small" style={{ width: "100%" }} placeholder={placeholder}
        showSearch optionFilterProp="children" disabled={disabled}
        status={formErrors[field] ? "error" : ""}
      >
        {opts.map(o => <Option key={o.id} value={o.id}>{o.label || o.name}</Option>)}
      </Select>
      {errText(formErrors[field])}
      {disabled && hint && !formErrors[field] && <Text type="secondary" style={{ fontSize: 11 }}>{hint}</Text>}
    </div>
  );

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 48,
      // The demo row carries a string id, so it is pinned first rather than
      // being fed to a numeric subtraction that would yield NaN.
      sorter: (a, b) => (a.isDemo ? -1 : b.isDemo ? 1 : a.id - b.id),
      sortOrder: sortedInfo.columnKey === "id" && sortedInfo.order,
      render: (t, r) => (
        <Text style={{ fontSize: 11, fontWeight: r.isDemo ? 700 : 400, color: r.isDemo ? "#00aaff" : undefined }}>
          {r.isDemo ? "DEMO" : t}
        </Text>
      ) },
    { title: "Data Center", key: "dc", width: 160, ellipsis: true,
      sorter: (a, b) => a.dataCenterName.localeCompare(b.dataCenterName),
      render: (_, r) => (
        <Space size={4}>
          <Avatar icon={<CloudServerOutlined />} style={{ backgroundColor: dcAvatarColor(r.status), flexShrink: 0 }} size={20} />
          <div>
            <Text strong style={{ fontSize: 11 }}>{r.dataCenterName}</Text>
            <div><Text type="secondary" style={{ fontSize: 10 }}>{r.dataCenterCode}</Text></div>
          </div>
        </Space>
      ) },
    { title: "Location", key: "location", width: 160, ellipsis: true,
      sorter: (a, b) => a.locationName.localeCompare(b.locationName),
      render: (_, r) => (
        <div>
          <Space size={4}><EnvironmentOutlined style={{ color: "#1890ff", fontSize: 10 }} /><Text strong style={{ fontSize: 11 }}>{r.locationName}</Text></Space>
          <div><Text type="secondary" style={{ fontSize: 10 }}>{r.cityName}, {r.countryName}</Text></div>
          <div><Text type="secondary" style={{ fontSize: 10 }}>Site: {r.siteName} · {r.tenantName}</Text></div>
        </div>
      ) },
    { title: "Dimensions", key: "dims", width: 100,
      render: (_, r) => r.dcLength && r.dcBreadth ? (
        <div>
          <Text style={{ fontSize: 10 }}>{r.dcLength}{r.dcLengthUnit} × {r.dcBreadth}{r.dcBreadthUnit}</Text>
          <div><Text type="secondary" style={{ fontSize: 10 }}>L × B{r.dxfFileName ? " · CAD" : ""}</Text></div>
        </div>
      ) : <Text type="secondary" style={{ fontSize: 10 }}>—</Text>
    },
    { title: "Door", key: "door", width: 100,
      render: (_, r) => (
        <div>
          <Space size={4}><CompassOutlined style={{ color: "#1890ff", fontSize: 10 }} /><Text style={{ fontSize: 10 }}>{r.doorDirection || "South"}</Text></Space>
          <div><Text type="secondary" style={{ fontSize: 10 }}>{r.doorPosition || "center"}</Text></div>
        </div>
      )
    },
    { title: "Power", key: "power", width: 100,
      render: (_, r) => (
        <div>
          <Text style={{ fontSize: 10 }}>{r.totalKW || r.powerCapacity || 0} {r.totalKWUnit || "kW"}</Text>
          <div><Text type="secondary" style={{ fontSize: 10 }}>Total Capacity</Text></div>
        </div>
      )
    },
    { title: "Racks", key: "racks", width: 110,
      sorter: (a, b) => utilPct(a.utilizedRacks, a.totalRacks) - utilPct(b.utilizedRacks, b.totalRacks),
      render: (_, r) => {
        const pct = utilPct(r.utilizedRacks, r.totalRacks);
        return (
          <Tooltip title={`${r.utilizedRacks}/${r.totalRacks} racks`}>
            <div>
              <Text style={{ fontSize: 10 }}>{r.utilizedRacks}/{r.totalRacks}</Text>
              <Progress percent={pct} size="small" showInfo={false}
                status={pct > 90 ? "exception" : pct > 70 ? "active" : "normal"} />
            </div>
          </Tooltip>
        );
      } },
    { title: "Power / Cooling", key: "specs", width: 120,
      render: (_, r) => (
        <div>
          <Space size={4}><ThunderboltOutlined style={{ color: "#fa8c16", fontSize: 10 }} /><Text style={{ fontSize: 10 }}>{r.powerCapacity} kW</Text></Space>
          <div><Space size={4}><HeatMapOutlined style={{ color: "#13c2c2", fontSize: 10 }} /><Text style={{ fontSize: 10 }}>{r.coolingCapacity} TR</Text></Space></div>
        </div>
      ) },
    { title: "Contact", key: "contact", width: 155, ellipsis: true,
      render: (_, r) => (
        <div>
          <Space size={4}><UserOutlined style={{ color: "#1890ff", fontSize: 10 }} /><Text style={{ fontSize: 11 }}>{r.contactPersonName}</Text></Space>
          <div><Space size={4}><MailOutlined style={{ color: "#722ed1", fontSize: 10 }} /><Text style={{ fontSize: 10 }}>{r.contactEmail}</Text></Space></div>
        </div>
      ) },
    { title: "Created", dataIndex: "createdDate", key: "createdDate", width: 88,
      sorter: (a, b) => new Date(a.createdDate) - new Date(b.createdDate),
      render: t => <Text style={{ fontSize: 10 }}>{t}</Text> },
    { title: "Status", dataIndex: "status", key: "status", width: 100,
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: t => statusBadge(t),
      filters: ["Active","Maintenance","Warning","Inactive"].map(v => ({ text: v, value: v })),
      onFilter: (v, r) => r.status === v },
    {
      title: "", key: "actions", width: 90, fixed: "right",
      render: (_, r) => (
        <Space size={0}>
          <Tooltip title="5D View">
            <Button
              type="text" size="small"
              icon={<EyeOutlined />}
              onClick={() => open3DView(r)}
              style={{
                color: "#00aaff", padding: "0 3px",
                background: "rgba(0,170,255,0.08)",
                border: "1px solid rgba(0,170,255,0.2)",
                borderRadius: 4, margin: "0 2px",
              }}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined />}
              onClick={() => openEditModal(r)} style={{ color: "#1890ff", padding: "0 3px" }} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button type="text" size="small" icon={<DeleteOutlined />}
              onClick={() => openDeleteModal(r)} style={{ color: "#ff4d4f", padding: "0 3px" }} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // ══════════════════════════════════════════════════════════════════════════
  // If the 5D viewer is open, render it full-screen in place of the list view.
  // ══════════════════════════════════════════════════════════════════════════
  if (show3DView && viewing3DDC) {
    return createPortal(
      <div
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 99990,
          background: "#0a0e1a",
        }}
      >
        <DataCenter3DView
          dc={viewing3DDC}
          onBack={close3DView}
          rooms={dcRooms[viewing3DDC.id] || []}
          theme={viewer3DTheme}
          onThemeChange={setViewer3DTheme}
        />
      </div>,
      document.body
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f0f2f5", padding: "10px 16px", boxSizing: "border-box", overflow: "hidden" }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexShrink: 0 }}>
        <div>
          <Title level={4} style={{ margin: 0, lineHeight: 1.3 }}>
            <CloudServerOutlined style={{ marginRight: 8, color: "#1890ff" }} />
            Data Center Management
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>Manage data center facilities and infrastructure</Text>
        </div>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal} size="small"
            style={{ background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)", border: "none" }}>
            Add Data Center
          </Button>
          <Button icon={<ReloadOutlined />} size="small" onClick={() => window.location.reload()}>Refresh</Button>
        </Space>
      </div>

      {/* ── STAT CARDS ── */}
      <Row gutter={10} style={{ marginBottom: 8, flexShrink: 0 }}>
        <Col span={4}><StatCard label="Total DCs"        value={totalCount}       color="#1890ff" icon={<CloudServerOutlined style={{ color: "#1890ff" }} />} /></Col>
        <Col span={4}><StatCard label="Active"           value={activeCount}      color="#52c41a" icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />} /></Col>
        <Col span={4}><StatCard label="Maintenance"      value={maintenanceCount} color="#722ed1" icon={<ApiOutlined         style={{ color: "#722ed1" }} />} /></Col>
        <Col span={4}><StatCard label="Warning"          value={warningCount}     color="#faad14" icon={<ExclamationCircleOutlined style={{ color: "#faad14" }} />} /></Col>
        <Col span={8}><StatCard label="Rack Utilization" value={`${totalRacksUsed} / ${totalRacksCap}`} color="#13c2c2" icon={<DashboardOutlined style={{ color: "#13c2c2" }} />} /></Col>
      </Row>

      {/* ── FILTERS ── */}
      <div style={{ backgroundColor: "white", borderRadius: 6, padding: "8px 12px", marginBottom: 8, flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={24} md={10} lg={10}>
            <Input placeholder="Search by name, code, location, city..."
              prefix={<SearchOutlined style={{ color: "#bbb" }} />}
              value={searchText} onChange={e => setSearchText(e.target.value)} allowClear size="small" />
          </Col>
          <Col xs={8} sm={6} md={5} lg={5}>
            <Select value={countryFilter} onChange={setCountryFilter} size="small" style={{ width: "100%" }}>
              <Option value="all">All Countries</Option>
              {uniqueCountries.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
            </Select>
          </Col>
          <Col xs={8} sm={6} md={4} lg={4}>
            <Select value={statusFilter} onChange={setStatusFilter} size="small" style={{ width: "100%" }}>
              <Option value="all">All Status</Option>
              {["Active","Maintenance","Warning","Inactive"].map(s => <Option key={s} value={s}>{s}</Option>)}
            </Select>
          </Col>
          <Col xs={0} sm={0} md={5} lg={5} style={{ textAlign: "right" }}>
            <Text style={{ fontSize: 12, color: "#888", whiteSpace: "nowrap" }}>{filteredDCs.length} / {totalCount} shown</Text>
          </Col>
        </Row>
      </div>

      {/* ── TABLE ── */}
      <div style={{ flex: 1, backgroundColor: "white", borderRadius: 6, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ padding: "7px 14px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <Text strong style={{ fontSize: 13 }}>Data Centers List</Text>
          <Badge count={filteredDCs.length} style={{ backgroundColor: "#1890ff" }} />
        </div>
        <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
          <Table
            columns={columns} dataSource={filteredDCs} loading={loading}
            bordered={false} rowKey="id" size="small" scroll={{ x: "max-content" }}
            pagination={{ pageSize: 8, showSizeChanger: false, showTotal: total => `${total} data centers`, size: "small", style: { padding: "5px 14px", margin: 0 } }}
            onChange={handleTableChange} style={{ fontSize: 12 }}
            locale={{ emptyText: <div style={{ padding: "12px 0", textAlign: "center", color: "#999", fontSize: 13 }}>No data found</div> }}
          />
        </div>
      </div>



      {/* ══ ADD / EDIT MODAL ══ */}
      {showModal && (
        <>
          <div style={backdropStyle} onClick={closeModal} />
          <div style={modalBoxStyle("900px")}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: "#1890ff", fontSize: 15 }}>
                {editingDC ? "Edit Data Center" : "Add New Data Center"}
              </h3>
              <Button type="text" icon={<CloseOutlined />} onClick={closeModal} style={{ color: "#666" }} />
            </div>

             {/* ── Technical Specifications ── */}
            <Divider style={{ margin: "4px 0 12px" }}>
              <Space size={4}><DashboardOutlined style={{ color: "#13c2c2" }} /><Text style={{ fontSize: 12 }} strong>Technical Specifications</Text></Space>
            </Divider>
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={12}>
                <label style={lbl}>Power Capacity (kW)</label>
                <InputNumber value={formData.powerCapacity} onChange={v => handleNumberChange("powerCapacity", v)} size="small" style={{ width: "100%" }} placeholder="e.g., 2500" min={0} max={10000} status={formErrors.powerCapacity ? "error" : ""} />
                {errText(formErrors.powerCapacity)}
              </Col>
              <Col span={12}>
                <label style={lbl}>Cooling Capacity (TR)</label>
                <InputNumber value={formData.coolingCapacity} onChange={v => handleNumberChange("coolingCapacity", v)} size="small" style={{ width: "100%" }} placeholder="e.g., 750" min={0} max={5000} status={formErrors.coolingCapacity ? "error" : ""} />
                {errText(formErrors.coolingCapacity)}
              </Col>
            </Row>

            {/* ── Total KW with Units ── */}
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={12}>
                <label style={lbl}>Total Power Capacity
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    (Auto-calculates Power & Cooling)
                  </Text>
                </label>
                <Input.Group compact>
                  <InputNumber
                    value={formData.totalKW}
                    onChange={v => handlePowerChange(v, formData.totalKWUnit)}
                    size="small"
                    style={{ width: "calc(100% - 110px)" }}
                    placeholder="e.g., 2000"
                    min={0}
                    status={formErrors.totalKW ? "error" : ""}
                  />
                  <Select
                    value={formData.totalKWUnit}
                    onChange={v => handlePowerChange(formData.totalKW, v)}
                    size="small"
                    style={{ width: 110 }}
                  >
                    {POWER_UNITS.map(u => <Option key={u.value} value={u.value}>{u.label}</Option>)}
                  </Select>
                </Input.Group>
                {errText(formErrors.totalKW)}
                {formData.totalKW && formData.totalKW > 0 && (
                  <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>
                    <Space size={12}>
                      <span>⚡ Power: {formData.powerCapacity || 0} kW</span>
                      <span>❄️ Cooling: {formData.coolingCapacity || 0} TR</span>
                    </Space>
                  </div>
                )}
              </Col>
              <Col span={12}>
                <div style={{
                  background: "#e6f7ff",
                  padding: "8px 12px",
                  borderRadius: 4,
                  border: "1px solid #91d5ff",
                  height: "100%",
                  display: "flex",
                  alignItems: "center"
                }}>
                  <div>
                    <Text style={{ fontSize: 12, color: "#0050b3" }}>
                      <strong>Power Unit Info:</strong>
                    </Text>
                    <div style={{ fontSize: 11, color: "#0050b3", marginTop: 2 }}>
                      • <strong>kW</strong> = Kilowatts (1,000 watts)<br/>
                      • <strong>MW</strong> = Megawatts (1,000,000 watts)<br/>
                      • <strong>BTU/h</strong> = British Thermal Units per hour<br/>
                      • <strong>Tons</strong> = Tons of Refrigeration (1 Ton = 3.517 kW)<br/>
                      • <strong>kVA</strong> = Kilovolt-Amperes (with 0.8 PF)<br/>
                      • <strong>HP</strong> = Horsepower (1 HP = 0.746 kW)
                    </div>
                  </div>
                </div>
              </Col>
            </Row>


            {/* ── Location Hierarchy ── */}
            <Divider style={{ margin: "0 0 12px" }}>
              <Space size={4}><GlobalOutlined style={{ color: "#1890ff" }} /><Text style={{ fontSize: 12 }} strong>Location Hierarchy</Text></Space>
            </Divider>
            <Row gutter={12} style={{ marginBottom: 14 }}>
              {/* Country */}
              <Col span={12}>
                <div>
                  <label style={lbl}>Country <span style={{ color: "#ff4d4f" }}>*</span></label>
                  <Select
                    value={formData.countryId || undefined}
                    onChange={handleCountryChange}
                    size="small" style={{ width: "100%" }}
                    placeholder="Select country"
                    showSearch optionFilterProp="children"
                    status={formErrors.countryId ? "error" : ""}
                  >
                    {countriesList.map(c => <Option key={c.id} value={c.id}>{c.name} ({c.code})</Option>)}
                  </Select>
                  {errText(formErrors.countryId)}
                </div>
              </Col>
              {/* State */}
              <Col span={12}>
                <div>
                  <label style={lbl}>State <span style={{ color: "#ff4d4f" }}>*</span></label>
                  <Select
                    value={formData.stateId || undefined}
                    onChange={handleStateChange}
                    size="small" style={{ width: "100%" }}
                    placeholder={formData.countryId ? "Select state" : "Select a country first"}
                    showSearch optionFilterProp="children"
                    disabled={!formData.countryId}
                    status={formErrors.stateId ? "error" : ""}
                  >
                    {availableStates.map(s => <Option key={s.id} value={s.id}>{s.name} ({s.code})</Option>)}
                  </Select>
                  {errText(formErrors.stateId)}
                  {!formData.countryId && !formErrors.stateId && <Text type="secondary" style={{ fontSize: 11 }}>Select a country first</Text>}
                </div>
              </Col>
            </Row>
            <Row gutter={12} style={{ marginBottom: 14 }}>
              {/* City */}
              <Col span={12}>
                <div>
                  <label style={lbl}>City <span style={{ color: "#ff4d4f" }}>*</span></label>
                  <Select
                    value={formData.cityId || undefined}
                    onChange={handleCityChange}
                    size="small" style={{ width: "100%" }}
                    placeholder={formData.stateId ? "Select city" : "Select a state first"}
                    showSearch optionFilterProp="children"
                    disabled={!formData.stateId}
                    status={formErrors.cityId ? "error" : ""}
                  >
                    {availableCities.map(c => <Option key={c.id} value={c.id}>{c.name} ({c.code})</Option>)}
                  </Select>
                  {errText(formErrors.cityId)}
                  {!formData.stateId && !formErrors.cityId && <Text type="secondary" style={{ fontSize: 11 }}>Select a state first</Text>}
                </div>
              </Col>
              {/* Site */}
              <Col span={12}>
                <div>
                  <label style={lbl}>Site <span style={{ color: "#ff4d4f" }}>*</span></label>
                  <Select
                    value={formData.siteId || undefined}
                    onChange={v => { setFormData(prev => ({ ...prev, siteId: v })); setErr("siteId", v); }}
                    size="small" style={{ width: "100%" }}
                    placeholder={formData.cityId ? "Select site" : "Select a city first"}
                    showSearch optionFilterProp="children"
                    disabled={!formData.cityId}
                    status={formErrors.siteId ? "error" : ""}
                  >
                    {availableSites.map(s => <Option key={s.id} value={s.id}>{s.name} ({s.code})</Option>)}
                  </Select>
                  {errText(formErrors.siteId)}
                  {!formData.cityId && !formErrors.siteId && <Text type="secondary" style={{ fontSize: 11 }}>Select a city first</Text>}
                </div>
              </Col>
            </Row>

            {/* ── Basic Information ── */}
            <Divider style={{ margin: "4px 0 12px" }}>
              <Space size={4}><CloudServerOutlined style={{ color: "#1890ff" }} /><Text style={{ fontSize: 12 }} strong>Basic Information</Text></Space>
            </Divider>
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={24}>{fldSelect("tenantId","Tenant",tenantsList.map(t=>({...t,label:`${t.name} (${t.code}) — ${t.type}`})),true,"Select tenant",false,"")}</Col>
            </Row>
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={12}>
                <label style={lbl}>Data Center Name <span style={{ color: "#ff4d4f" }}>*</span></label>
                <input name="dataCenterName" value={formData.dataCenterName} onChange={handleInputChange}
                  style={{ ...inputStyle, borderColor: formErrors.dataCenterName ? "#ff4d4f" : "#d9d9d9" }}
                  placeholder="e.g., LAX1 - Main Facility"
                  onFocus={e => e.target.style.borderColor="#1890ff"} onBlur={e => e.target.style.borderColor=formErrors.dataCenterName?"#ff4d4f":"#d9d9d9"} />
                {errText(formErrors.dataCenterName)}
              </Col>
              <Col span={12}>
                <label style={lbl}>Data Center Code <span style={{ color: "#ff4d4f" }}>*</span></label>
                <input name="dataCenterCode" value={formData.dataCenterCode} onChange={handleInputChange}
                  style={{ ...inputStyle, textTransform:"uppercase", borderColor: formErrors.dataCenterCode ? "#ff4d4f" : "#d9d9d9" }}
                  placeholder="e.g., LAX-MAIN-01"
                  onFocus={e => e.target.style.borderColor="#1890ff"} onBlur={e => e.target.style.borderColor=formErrors.dataCenterCode?"#ff4d4f":"#d9d9d9"} />
                {errText(formErrors.dataCenterCode)}
              </Col>
            </Row>

            {/* ── Location Details ── */}
            <Divider style={{ margin: "4px 0 12px" }}>
              <Space size={4}><EnvironmentOutlined style={{ color: "#ff4d4f" }} /><Text style={{ fontSize: 12 }} strong>Location Details</Text></Space>
            </Divider>
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={24}>
                <label style={lbl}>Location Name <span style={{ color: "#ff4d4f" }}>*</span></label>
                <input name="locationName" value={formData.locationName} onChange={handleInputChange}
                  style={{ ...inputStyle, borderColor: formErrors.locationName ? "#ff4d4f" : "#d9d9d9" }}
                  placeholder="e.g., Main Data Center"
                  onFocus={e => e.target.style.borderColor="#1890ff"} onBlur={e => e.target.style.borderColor=formErrors.locationName?"#ff4d4f":"#d9d9d9"} />
                {errText(formErrors.locationName)}
              </Col>
            </Row>
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={16}>
                <label style={lbl}>Street Address <span style={{ color: "#ff4d4f" }}>*</span></label>
                <input name="streetAddress" value={formData.streetAddress} onChange={handleInputChange}
                  style={{ ...inputStyle, borderColor: formErrors.streetAddress ? "#ff4d4f" : "#d9d9d9" }}
                  placeholder="e.g., 123 Main Street"
                  onFocus={e => e.target.style.borderColor="#1890ff"} onBlur={e => e.target.style.borderColor=formErrors.streetAddress?"#ff4d4f":"#d9d9d9"} />
                {errText(formErrors.streetAddress)}
              </Col>
              <Col span={8}>
                <label style={lbl}>PIN Code <span style={{ color: "#ff4d4f" }}>*</span></label>
                <input name="pinCode" value={formData.pinCode} onChange={handleInputChange}
                  style={{ ...inputStyle, borderColor: formErrors.pinCode ? "#ff4d4f" : "#d9d9d9" }}
                  placeholder="e.g., 94105"
                  onFocus={e => e.target.style.borderColor="#1890ff"} onBlur={e => e.target.style.borderColor=formErrors.pinCode?"#ff4d4f":"#d9d9d9"} />
                {errText(formErrors.pinCode)}
              </Col>
            </Row>
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={12}>
                <label style={lbl}>Latitude <Text type="secondary" style={{ fontSize: 11 }}>(optional)</Text></label>
                <input name="latitude" value={formData.latitude} onChange={handleInputChange}
                  style={{ ...inputStyle, borderColor: formErrors.latitude ? "#ff4d4f" : "#d9d9d9" }} placeholder="Range: -90 to 90"
                  onFocus={e => e.target.style.borderColor="#1890ff"} onBlur={e => e.target.style.borderColor=formErrors.latitude?"#ff4d4f":"#d9d9d9"} />
                {errText(formErrors.latitude)}
              </Col>
              <Col span={12}>
                <label style={lbl}>Longitude <Text type="secondary" style={{ fontSize: 11 }}>(optional)</Text></label>
                <input name="longitude" value={formData.longitude} onChange={handleInputChange}
                  style={{ ...inputStyle, borderColor: formErrors.longitude ? "#ff4d4f" : "#d9d9d9" }} placeholder="Range: -180 to 180"
                  onFocus={e => e.target.style.borderColor="#1890ff"} onBlur={e => e.target.style.borderColor=formErrors.longitude?"#ff4d4f":"#d9d9d9"} />
                {errText(formErrors.longitude)}
              </Col>
            </Row>

            {/* ══════════════════════════════════════════════════════════════
                NEW: unified "Floor Setup" — Manual Entry OR DXF Import.
                Only one of the two sub-sections shows, based on the toggle.
            ══════════════════════════════════════════════════════════════ */}
            <Divider style={{ margin: "4px 0 12px" }}>
              <Space size={4}>
                <CompassOutlined style={{ color: "#1890ff" }} />
                <Text style={{ fontSize: 12 }} strong>Floor Setup</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>Choose how the floor plan is defined</Text>
              </Space>
            </Divider>
            <Row style={{ marginBottom: 14 }}>
              <Col span={24}>
                <Radio.Group
                  value={formData.dcSetupMode}
                  onChange={e => handleSetupModeChange(e.target.value)}
                  optionType="button"
                  buttonStyle="solid"
                  size="small"
                >
                  <Radio.Button value="manual">
                    <EditOutlined /> Manual Entry (type Length × Breadth)
                  </Radio.Button>
                  <Radio.Button value="dxf">
                    <FileOutlined /> Import from DXF (auto-fill from CAD)
                  </Radio.Button>
                </Radio.Group>
              </Col>
            </Row>

            {/* ── Option A: Manual Entry ── */}
            {formData.dcSetupMode === "manual" && (
              <Row gutter={12} style={{ marginBottom: 14 }}>
                <Col span={12}>
                  <DimField label="Length" direction="East–West" numField="dcLength" unitField="dcLengthUnit" />
                </Col>
                <Col span={12}>
                  <DimField label="Breadth" direction="North–South" numField="dcBreadth" unitField="dcBreadthUnit" />
                </Col>
              </Row>
            )}

            {/* ── Option B: Import from DXF ── */}
            {formData.dcSetupMode === "dxf" && (
              <Row gutter={12} style={{ marginBottom: 14 }}>
                <Col span={24}>
                  <div style={{
                    border: "1px dashed #d3adf7", borderRadius: 6, padding: "12px 14px",
                    background: "#f9f0ff", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
                  }}>
                    <Upload
                      accept=".dxf,.dwg"
                      showUploadList={false}
                      disabled={dxfUploading}
                      beforeUpload={handleCadFile}
                    >
                      <Button icon={<UploadOutlined />} loading={dxfUploading} size="small">
                        {dxfUploading ? "Reading CAD file…" : "Upload .dxf (or .dwg)"}
                      </Button>
                    </Upload>

                    {dxfFileInfo ? (
                      <Space size={8} wrap>
                        <Space size={4}>
                          <FileOutlined style={{ color: "#722ed1" }} />
                          <Text style={{ fontSize: 12 }} strong>{dxfFileInfo.name}</Text>
                        </Space>
                        {dxfFileInfo.widthM != null && (
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {dxfFileInfo.widthM.toFixed(2)}m × {dxfFileInfo.lengthM.toFixed(2)}m
                          </Text>
                        )}
                        {dxfFileInfo.entityCount != null && (
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {dxfFileInfo.entityCount} entities
                          </Text>
                        )}
                        <Button
                          type="text" size="small" danger
                          icon={<RemoveFileIcon />}
                          onClick={clearCadFile}
                        >
                          Remove
                        </Button>
                      </Space>
                    ) : (
                      <Text type="secondary" style={{ fontSize: 11.5 }}>
                        Only <b>.dxf</b> (ASCII) is parsed in-browser. For <b>.dwg</b>, export as DXF from
                        AutoCAD/DraftSight first (File → Save As → AutoCAD DXF).
                      </Text>
                    )}
                  </div>

                  {/* Read-only preview of the dimensions that came from the DXF */}
                  {formData.dcLength && formData.dcBreadth && (
                    <div style={{
                      marginTop: 10, display: "flex", gap: 12,
                      background: "#f6ffed", border: "1px solid #b7eb8f", borderRadius: 6, padding: "8px 12px",
                    }}>
                      <Text style={{ fontSize: 12 }}>
                        Length (E–W): <b>{formData.dcLength} {formData.dcLengthUnit}</b>
                      </Text>
                      <Text style={{ fontSize: 12 }}>
                        Breadth (N–S): <b>{formData.dcBreadth} {formData.dcBreadthUnit}</b>
                      </Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>(auto-filled from the DXF, not editable)</Text>
                    </div>
                  )}
                </Col>
              </Row>
            )}

            {(formData.dcLength && formData.dcBreadth) && (
              <div style={{ background: "linear-gradient(135deg,#e6f7ff,#f0f5ff)", border: "1px solid #91d5ff", borderRadius: 6, padding: "8px 12px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <EyeOutlined style={{ color: "#1890ff" }} />
                <Text style={{ fontSize: 12, color: "#0050b3" }}>
                  Floor area: <strong>{formData.dcLength} {formData.dcLengthUnit} (E–W) × {formData.dcBreadth} {formData.dcBreadthUnit} (N–S)</strong>
                  {" "}— 5D view will be available after saving.
                  {formData.dxfEntities && formData.dcSetupMode === "dxf" ? " CAD outline will render as an overlay on the raised floor." : ""}
                </Text>
              </div>
            )}

            {/* ── Door Placement ── */}
            <Divider style={{ margin: "4px 0 12px" }}>
              <Space size={4}>
                <CompassOutlined style={{ color: "#fa541c" }} />
                <Text style={{ fontSize: 12 }} strong>Door Placement</Text>
                <Text type="secondary" style={{ fontSize: 11 }}>Choose which wall the entrance is on</Text>
              </Space>
            </Divider>
            <Row gutter={12} style={{ marginBottom: 10 }}>
              <Col span={12}>
                <label style={lbl}>Door Direction (Wall)</label>
                <Select
                  value={formData.doorDirection}
                  onChange={v => handleSelectChange("doorDirection", v)}
                  size="small" style={{ width: "100%" }}
                >
                  {DOOR_DIRECTIONS.map(d => <Option key={d.value} value={d.value}>{d.label}</Option>)}
                </Select>
              </Col>
              <Col span={12}>
                <label style={lbl}>Door Position on Wall</label>
                <Select
                  value={formData.doorPosition}
                  onChange={v => handleSelectChange("doorPosition", v)}
                  size="small" style={{ width: "100%" }}
                >
                  {DOOR_POSITIONS.map(p => <Option key={p.value} value={p.value}>{p.label}</Option>)}
                </Select>
              </Col>
            </Row>
            <div style={{ background: "#fff7e6", border: "1px solid #ffd591", borderRadius: 6, padding: "8px 12px", marginBottom: 14 }}>
              <Text style={{ fontSize: 12, color: "#873800" }}>
                Door will be placed on the <strong>{formData.doorDirection}</strong> wall,{" "}
                <strong>{DOOR_POSITIONS.find(p => p.value === formData.doorPosition)?.label.toLowerCase()}</strong>.
              </Text>
            </div>

            {/* ── Contact Information ── */}
            <Divider style={{ margin: "4px 0 12px" }}>
              <Space size={4}><UserOutlined style={{ color: "#1890ff" }} /><Text style={{ fontSize: 12 }} strong>Contact Information</Text></Space>
            </Divider>
            <Row gutter={12} style={{ marginBottom: formData.contactPersonId ? 8 : 14 }}>
              <Col span={24}>
                <label style={lbl}>Contact Person <span style={{ color: "#ff4d4f" }}>*</span></label>
                <Select value={formData.contactPersonId || undefined} onChange={handleContactChange}
                  size="small" style={{ width: "100%" }} placeholder="Select contact person" showSearch optionFilterProp="children"
                  status={formErrors.contactPersonId ? "error" : ""}>
                  {usersList.map(u => (
                    <Option key={u.id} value={u.id}>
                      <Space size={4}><UserOutlined style={{ color: "#1890ff" }} /><Text strong>{u.name}</Text><Text type="secondary" style={{ fontSize: 11 }}>({u.role})</Text></Space>
                    </Option>
                  ))}
                </Select>
                {errText(formErrors.contactPersonId)}
              </Col>
            </Row>
            {formData.contactPersonId && (
              <div style={{ backgroundColor: "#f5f5f5", padding: "10px 14px", borderRadius: 4, marginBottom: 14 }}>
                <Row gutter={16}>
                  <Col span={12}><Space size={4}><MailOutlined style={{ color: "#722ed1" }} /><Text style={{ fontSize: 12 }}>{formData.contactEmail}</Text></Space></Col>
                  <Col span={12}><Space size={4}><PhoneOutlined style={{ color: "#52c41a" }} /><Text style={{ fontSize: 12 }}>{formData.contactPhone}</Text></Space></Col>
                </Row>
              </div>
            )}

            {/* ── Status ── */}
            <Row gutter={12} style={{ marginBottom: 14 }}>
              <Col span={12}>
                <label style={lbl}>Status</label>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                  <Switch checked={formData.status} onChange={checked => setFormData(prev => ({ ...prev, status: checked }))}
                    checkedChildren="Active" unCheckedChildren="Inactive"
                    style={{ backgroundColor: formData.status ? "#52c41a" : "#ff4d4f" }} />
                  <Text style={{ fontSize: 12, color: formData.status ? "#52c41a" : "#ff4d4f", fontWeight: 500 }}>
                    {formData.status ? "Active" : "Inactive"}
                  </Text>
                </div>
              </Col>
            </Row>

            <Divider style={{ margin: "12px 0" }} />
            <div style={{ textAlign: "right" }}>
              <Button onClick={closeModal} style={{ marginRight: 8 }}>Cancel</Button>
              <Button type="primary" loading={loading} onClick={handleSubmit} icon={editingDC ? <EditOutlined /> : <PlusOutlined />}>
                {loading ? "Saving..." : editingDC ? "Update Data Center" : "Create Data Center"}
              </Button>
            </div>
          </div>
        </>
      )}


      {/* ══ DELETE MODAL ══ */}
      {showDeleteModal && dcToDelete && (
        <>
          <div style={backdropStyle} onClick={closeDeleteModal} />
          <div style={{ ...modalBoxStyle("480px"), textAlign: "center" }}>
            <ExclamationCircleOutlined style={{ fontSize: 40, color: "#ff4d4f", marginBottom: 10 }} />
            <h3 style={{ color: "#ff4d4f", marginBottom: 6 }}>Delete Data Center</h3>
            <p style={{ fontSize: 14, marginBottom: 10 }}>Are you sure you want to delete this data center?</p>
            <div style={{ backgroundColor: "#f5f5f5", padding: 12, borderRadius: 4, marginBottom: 12, textAlign: "left", fontSize: 13 }}>
              {[
                ["Name",     dcToDelete.dataCenterName],
                ["Code",     dcToDelete.dataCenterCode],
                ["Tenant",   dcToDelete.tenantName],
                ["Location", dcToDelete.locationName],
                ["Address",  `${dcToDelete.streetAddress}, ${dcToDelete.cityName}, ${dcToDelete.countryName}`],
                ["Racks",    `${dcToDelete.utilizedRacks} / ${dcToDelete.totalRacks}`],
                ["Power",    `${dcToDelete.totalKW || dcToDelete.powerCapacity} ${dcToDelete.totalKWUnit || "kW"}`],
                ["Cooling",  `${dcToDelete.coolingCapacity} TR`],
                ["Door",     `${dcToDelete.doorDirection || "South"} · ${dcToDelete.doorPosition || "center"}`],
                ["CAD File", dcToDelete.dxfFileName || "—"],
                ["Contact",  dcToDelete.contactPersonName],
                ["Status",   dcToDelete.status],
              ].map(([k, v]) => <p key={k} style={{ margin: "3px 0" }}><strong>{k}:</strong> {v}</p>)}
            </div>
            <p style={{ color: "#ff7875", fontSize: 12, marginBottom: 16 }}>This action cannot be undone.</p>
            <Space>
              <Button onClick={closeDeleteModal}>Cancel</Button>
              <Button danger type="primary" onClick={handleDelete} icon={<DeleteOutlined />}>Delete Data Center</Button>
            </Space>
          </div>
        </>
      )}

    </div>
  );
};

export default AddDataCenter;