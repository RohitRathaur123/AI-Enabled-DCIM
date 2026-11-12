//---------------------------------below code is ip addres on top of card--------------------------------------------

// import React, { useState, useEffect } from "react";
// import {
//   Row,
//   Col,
//   Card,
//   Typography,
//   Space,
//   Divider,
//   Select,
//   Tooltip,
//   Button,
//   Badge,
//   Tag,
//   Statistic,
//   Spin,
//   Alert,
//   Input,
// } from "antd";
// import {
//   PieChartOutlined,
//   EnvironmentOutlined,
//   ReloadOutlined,
//   InfoCircleOutlined,
//   WarningOutlined,
//   SafetyOutlined,
//   WifiOutlined,
//   CloudOutlined,
//   ExclamationCircleOutlined,
//   SearchOutlined,
//   ClearOutlined,
//   CalendarOutlined,
//   ClockCircleOutlined,
// } from "@ant-design/icons";
// import { CO2API, gasFetch } from "../../../config";

// const { Title, Text } = Typography;
// const { Option } = Select;
// const { Search } = Input;

// // Color scheme for different status levels
// const STATUS_COLORS = {
//   normal: "#52c41a", // Green
//   severe: "#faad14", // Orange
//   critical: "#f5222d", // Red
//   inactive: "#8c8c8c", // Gray for inactive
//   default: "#d9d9d9", // Gray
// };

// // Device type constants
// const DEVICE_TYPES = {
//   CO2: 30000,
//   PH3: 30001,
// };

// // Static thresholds (will be replaced by API data)
// const DEFAULT_THRESHOLDS = {
//   [DEVICE_TYPES.CO2]: {
//     normal: { min: 0, max: 600 },
//     severe: { min: 600, max: 1500 },
//     critical: { min: 1500, max: 5500 },
//   },
//   [DEVICE_TYPES.PH3]: {
//     normal: { min: 0, max: 3 },
//     severe: { min: 3, max: 7.5 },
//     critical: { min: 7.5, max: 25 },
//   },
// };

// // Determine status based on value and thresholds
// const getStatus = (value, thresholds, deviceTypeId) => {
//   // Handle inactive devices (null values)
//   if (value === null || value === undefined) {
//     return "inactive";
//   }
  
//   if (!thresholds[deviceTypeId]) {
//     // Fallback to default thresholds if API data not loaded
//     const defaultThresholds = DEFAULT_THRESHOLDS[deviceTypeId];
//     if (value <= defaultThresholds.normal.max) return "normal";
//     if (value <= defaultThresholds.severe.max) return "severe";
//     return "critical";
//   }

//   if (value <= thresholds[deviceTypeId].normal.max) return "normal";
//   if (value <= thresholds[deviceTypeId].severe.max) return "severe";
//   return "critical";
// };

// // Get overall location status based on both CO2 and Phosphine
// const getOverallLocationStatus = (locationData, thresholds) => {
//   if (!locationData || locationData.length === 0) return "default";

//   let co2Status = "default";
//   let ph3Status = "default";

//   locationData.forEach((device) => {
//     const status = getStatus(device.value, thresholds, device.deviceTypeId);
//     if (device.deviceTypeId === DEVICE_TYPES.CO2) {
//       co2Status = status;
//     } else if (device.deviceTypeId === DEVICE_TYPES.PH3) {
//       ph3Status = status;
//     }
//   });

//   // Return the worst status
//   if (co2Status === "critical" || ph3Status === "critical") return "critical";
//   if (co2Status === "severe" || ph3Status === "severe") return "severe";
//   if (co2Status === "normal" || ph3Status === "normal") return "normal";
//   if (co2Status === "inactive" || ph3Status === "inactive") return "inactive";
//   return "default";
// };

// // Get status color
// const getStatusColor = (status) =>
//   STATUS_COLORS[status] || STATUS_COLORS.default;

// // Get status icon
// const getStatusIcon = (status) => {
//   switch (status) {
//     case "normal":
//       return (
//         <SafetyOutlined
//           style={{ color: STATUS_COLORS.normal, fontSize: "14px" }}
//         />
//       );
//     case "severe":
//       return (
//         <WarningOutlined
//           style={{ color: STATUS_COLORS.severe, fontSize: "14px" }}
//         />
//       );
//     case "critical":
//       return (
//         <WarningOutlined
//           style={{ color: STATUS_COLORS.critical, fontSize: "14px" }}
//         />
//       );
//     case "inactive":
//       return (
//         <ExclamationCircleOutlined
//           style={{ color: STATUS_COLORS.inactive, fontSize: "14px" }}
//         />
//       );
//     default:
//       return null;
//   }
// };

// // Get the latest dateTime from devices in a location
// const getLatestDateTime = (devices) => {
//   if (!devices || devices.length === 0) return null;
  
//   // Filter out null dateTimes
//   const validDateTimes = devices
//     .map(device => device.dateTime)
//     .filter(dateTime => dateTime !== null);
    
//   if (validDateTimes.length === 0) return null;
  
//   // Find the latest dateTime
//   const latest = validDateTimes.reduce((latest, current) => {
//     return new Date(current) > new Date(latest) ? current : latest;
//   }, validDateTimes[0]);
  
//   return latest;
// };

// // Format date time for display
// const formatDateTime = (dateTimeString) => {
//   if (!dateTimeString) return null;
  
//   try {
//     const date = new Date(dateTimeString);
//     return {
//       date: date.toLocaleDateString('en-GB', { 
//         day: '2-digit', 
//         month: 'short', 
//         year: 'numeric' 
//       }),
//       time: date.toLocaleTimeString('en-GB', { 
//         hour: '2-digit', 
//         minute: '2-digit',
//         hour12: false 
//       }),
//       full: date.toLocaleString('en-GB', {
//         day: '2-digit',
//         month: 'short',
//         year: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit',
//         hour12: false
//       })
//     };
//   } catch (error) {
//     console.error('Error formatting date:', error);
//     return null;
//   }
// };

// // Radial Gauge Component
// const RadialGauge = ({ value, thresholds, deviceTypeId, maxValue = null }) => {
//   const status = getStatus(value, thresholds, deviceTypeId);
  
//   // Handle inactive devices
//   if (status === "inactive") {
//     return (
//       <div
//         style={{
//           position: "relative",
//           width: "80px",
//           height: "80px",
//           margin: "0 auto",
//         }}
//       >
//         <div
//           style={{
//             position: "absolute",
//             width: "80px",
//             height: "80px",
//             borderRadius: "50%",
//             background: STATUS_COLORS.inactive,
//             opacity: 0.3,
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//           }}
//         >
//           <ExclamationCircleOutlined 
//             style={{ 
//               fontSize: "24px", 
//               color: STATUS_COLORS.inactive 
//             }} 
//           />
//         </div>
//         <div
//           style={{
//             position: "absolute",
//             width: "60px",
//             height: "60px",
//             borderRadius: "50%",
//             background: "white",
//             top: "10px",
//             left: "10px",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
//           }}
//         >
//           <div style={{ textAlign: "center" }}>
//             <div
//               style={{
//                 fontSize: "14px",
//                 fontWeight: "bold",
//                 color: STATUS_COLORS.inactive,
//               }}
//             >
//               Offline
//             </div>
//             <div style={{ fontSize: "10px", color: "#666" }}>Device</div>
//           </div>
//         </div>
//       </div>
//     );
//   }
  
//   // Determine max value for percentage calculation
//   let maxValueForGauge = maxValue;
//   if (!maxValueForGauge && thresholds[deviceTypeId]) {
//     maxValueForGauge = thresholds[deviceTypeId].critical.max;
//   } else if (!maxValueForGauge) {
//     maxValueForGauge = deviceTypeId === DEVICE_TYPES.CO2 ? 5500 : 25;
//   }
  
//   const percentage = Math.min(100, (value / maxValueForGauge) * 100);

//   return (
//     <div
//       style={{
//         position: "relative",
//         width: "80px",
//         height: "80px",
//         margin: "0 auto",
//       }}
//     >
//       {/* Outer ring */}
//       <div
//         style={{
//           position: "absolute",
//           width: "80px",
//           height: "80px",
//           borderRadius: "50%",
//           background: `conic-gradient(${getStatusColor(
//             status
//           )} 0% ${percentage}%, #f5f5f5 ${percentage}% 100%)`,
//           boxShadow: `0 0 8px ${getStatusColor(status)}40`,
//         }}
//       />

//       {/* Inner circle */}
//       <div
//         style={{
//           position: "absolute",
//           width: "60px",
//           height: "60px",
//           borderRadius: "50%",
//           background: "white",
//           top: "10px",
//           left: "10px",
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "center",
//           boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
//         }}
//       >
//         <div style={{ textAlign: "center" }}>
//           <div
//             style={{
//               fontSize: deviceTypeId === DEVICE_TYPES.CO2 ? "16px" : "14px",
//               fontWeight: "bold",
//               color: getStatusColor(status),
//             }}
//           >
//             {deviceTypeId === DEVICE_TYPES.CO2 ? value : value.toFixed(2)}
//           </div>
//           <div style={{ fontSize: "10px", color: "#666" }}>ppm</div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // DisplayDashboard Component
// const DisplayDashboard = () => {
//   const [selectedSite, setSelectedSite] = useState("Sonipat (Haryana)");
//   const [refreshCounter, setRefreshCounter] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [thresholds, setThresholds] = useState({});
//   const [locationData, setLocationData] = useState({});
//   const [processedLocations, setProcessedLocations] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredLocations, setFilteredLocations] = useState([]);

//   // Process thresholds data from API
//   const processThresholdsData = (apiData) => {
//     const processed = {};
    
//     apiData.forEach((item) => {
//       if (!processed[item.deviceTypeId]) {
//         processed[item.deviceTypeId] = {};
//       }
      
//       switch (item.alertType.toLowerCase()) {
//         case 'normal':
//           processed[item.deviceTypeId].normal = {
//             min: item.minValue,
//             max: item.maxValue,
//           };
//           break;
//         case 'severe':
//           processed[item.deviceTypeId].severe = {
//             min: item.minValue,
//             max: item.maxValue,
//           };
//           break;
//         case 'critical':
//           processed[item.deviceTypeId].critical = {
//             min: item.minValue,
//             max: item.maxValue,
//           };
//           break;
//         default:
//           break;
//       }
//     });
    
//     return processed;
//   };

//   // Process location data from API
//   const processLocationData = (apiData) => {
//     const processed = [];
    
//     Object.entries(apiData).forEach(([locationName, devices]) => {
//       // Group devices by type
//       const co2Devices = devices.filter(d => d.deviceTypeId === DEVICE_TYPES.CO2);
//       const ph3Devices = devices.filter(d => d.deviceTypeId === DEVICE_TYPES.PH3);
      
//       const location = {
//         id: locationName,
//         name: locationName,
//         devices: devices, // Store raw device data
//         co2Devices: co2Devices,
//         ph3Devices: ph3Devices,
//         hasMultipleCO2: co2Devices.length > 1,
//         hasMultiplePH3: ph3Devices.length > 1,
//         hasMultipleDevices: co2Devices.length > 1 || ph3Devices.length > 1,
//         totalDevices: devices.length,
//       };
      
//       processed.push(location);
//     });
    
//     // Sort locations: 2-device cards first, 4-device cards last
//     return processed.sort((a, b) => {
//       // If both have multiple devices or both don't, maintain original order
//       if (a.hasMultipleDevices === b.hasMultipleDevices) return 0;
//       // Put 2-device cards (no multiple devices) first
//       if (!a.hasMultipleDevices && b.hasMultipleDevices) return -1;
//       // Put 4-device cards (multiple devices) last
//       return 1;
//     });
//   };

//   // Fetch data from APIs
//   const fetchData = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       // Fetch thresholds
//       const thresholdsResponse = await fetch(
//         `${CO2API}/api/device-ranges`
//       );
//       const thresholdsData = await thresholdsResponse.json();
//       const processedThresholds = processThresholdsData(thresholdsData);
//       setThresholds(processedThresholds);

//       // Fetch location alerts
//       const alertsResponse = await fetch(
//         `${CO2API}/api/device-logs/alerts`
//       );
//       const alertsData = await alertsResponse.json();
//       const processedLocations = processLocationData(alertsData);
//       setLocationData(alertsData);
//       setProcessedLocations(processedLocations);
//       setFilteredLocations(processedLocations); // Initialize filtered locations
      
//     } catch (err) {
//       setError("Failed to fetch data. Please try again.");
//       console.error("Error fetching data:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Initial data fetch
//   useEffect(() => {
//     fetchData();
//   }, []);

//   // Filter locations based on search term
//   useEffect(() => {
//     if (!searchTerm.trim()) {
//       setFilteredLocations(processedLocations);
//       return;
//     }

//     const searchLower = searchTerm.toLowerCase();
//     const filtered = processedLocations.filter(location => {
//       // Search in location name
//       if (location.name.toLowerCase().includes(searchLower)) return true;
      
//       // Search in all device IP addresses
//       const allIPs = location.devices.map(d => d.ipAddress).filter(ip => ip);
//       if (allIPs.some(ip => ip.toLowerCase().includes(searchLower))) return true;
      
//       // Search in all device values
//       const allValues = location.devices.map(d => d.value ? d.value.toString() : "inactive");
//       if (allValues.some(val => val.includes(searchLower))) return true;
      
//       // Search in status
//       const overallStatus = getOverallLocationStatus(location.devices, thresholds);
//       if (overallStatus.toLowerCase().includes(searchLower)) return true;
      
//       // Search in individual device statuses
//       const allStatuses = location.devices.map(device => 
//         getStatus(device.value, thresholds, device.deviceTypeId)
//       );
//       if (allStatuses.some(status => status.toLowerCase().includes(searchLower))) return true;
      
//       return false;
//     });
    
//     setFilteredLocations(filtered);
//   }, [searchTerm, processedLocations, thresholds]);

//   // Handle search
//   const handleSearch = (value) => {
//     setSearchTerm(value);
//   };

//   // Clear search
//   const handleClearSearch = () => {
//     setSearchTerm("");
//   };

//   // Handle refresh
//   const handleRefresh = () => {
//     setSearchTerm(""); // Clear search on refresh
//     setRefreshCounter((prev) => prev + 1);
//     fetchData();
//   };

//   // Calculate summary statistics based on filtered locations
//   const calculateSummary = () => {
//     const totalGodowns = filteredLocations.length;
    
//     // Calculate averages across all devices
//     let totalCO2 = 0;
//     let totalPH3 = 0;
//     let co2Count = 0;
//     let ph3Count = 0;

//     filteredLocations.forEach((location) => {
//       location.co2Devices.forEach(device => {
//         if (device.value !== null && device.value !== undefined) {
//           totalCO2 += device.value;
//           co2Count++;
//         }
//       });
//       location.ph3Devices.forEach(device => {
//         if (device.value !== null && device.value !== undefined) {
//           totalPH3 += device.value;
//           ph3Count++;
//         }
//       });
//     });

//     const avgCO2 = co2Count > 0 ? Math.round(totalCO2 / co2Count) : 0;
//     const avgPhosphine = ph3Count > 0 ? totalPH3 / ph3Count : 0;

//     // Count statuses based on overall location status
//     let normalCount = 0;
//     let severeCount = 0;
//     let criticalCount = 0;
//     let inactiveCount = 0;

//     filteredLocations.forEach((location) => {
//       const overallStatus = getOverallLocationStatus(location.devices, thresholds);
//       if (overallStatus === "normal") normalCount++;
//       else if (overallStatus === "severe") severeCount++;
//       else if (overallStatus === "critical") criticalCount++;
//       else if (overallStatus === "inactive") inactiveCount++;
//     });

//     return {
//       totalGodowns,
//       avgCO2,
//       avgPhosphine,
//       normalCount,
//       severeCount,
//       criticalCount,
//       inactiveCount,
//     };
//   };

//   const summary = calculateSummary();

//   // Get threshold text for legend
//   const getThresholdText = (deviceTypeId, statusType) => {
//     if (!thresholds[deviceTypeId] || !thresholds[deviceTypeId][statusType]) {
//       const defaultThresholds = DEFAULT_THRESHOLDS[deviceTypeId];
//       return statusType === 'normal' 
//         ? `≤ ${defaultThresholds.normal.max} ppm`
//         : statusType === 'severe'
//         ? `≤ ${defaultThresholds.severe.max} ppm`
//         : `≤ ${defaultThresholds.critical.max} ppm`;
//     }
    
//     return `≤ ${thresholds[deviceTypeId][statusType].max} ppm`;
//   };

//   // Render a single device gauge with label
//   const renderDeviceGauge = (device, index, isWideCard = false) => {
//     const status = getStatus(device.value, thresholds, device.deviceTypeId);
//     const isCO2 = device.deviceTypeId === DEVICE_TYPES.CO2;
    
//     return (
//       <div key={`${device.ipAddress}-${index}`} style={{ width: isWideCard ? "25%" : "48%", textAlign: "center" }}>
//         <RadialGauge
//           value={device.value}
//           thresholds={thresholds}
//           deviceTypeId={device.deviceTypeId}
//         />
//         <div
//           style={{
//             marginTop: "8px",
//             padding: "4px 6px",
//             backgroundColor: status === "inactive" ? "#f5f5f5" : `${getStatusColor(status)}15`,
//             borderRadius: "4px",
//             border: `1px solid ${status === "inactive" ? STATUS_COLORS.inactive : getStatusColor(status)}30`,
//           }}
//         >
//           <Space direction="vertical" size={2} align="center">
//             <Text
//               strong
//               style={{
//                 fontSize: "12px",
//                 color: getStatusColor(status),
//               }}
//             >
//               {isCO2 ? "CO₂" : "PH₃"}: {status === "inactive" ? "INACTIVE" : status.toUpperCase()}
//             </Text>
//             <Text
//               type="secondary"
//               style={{ fontSize: "10px", color: "black" }}
//             >
//               {status === "inactive" ? "Offline" : `${isCO2 ? device.value : device.value.toFixed(2)} ppm`}
//             </Text>
//             <Text
//               style={{
//                 fontSize: "9px",
//                 fontFamily: "monospace",
//                 color: "#666",
//               }}
//             >
//               IP: {device.ipAddress || "N/A"}
//             </Text>
//           </Space>
//         </div>
//       </div>
//     );
//   };

//   // Render a standard location card (for 2 devices)
//   const renderStandardLocationCard = (location) => {
//     const overallStatus = getOverallLocationStatus(location.devices, thresholds);
//     const latestDateTime = getLatestDateTime(location.devices);
//     const formattedDateTime = formatDateTime(latestDateTime);
    
//     // Get the first CO2 and PH3 devices
//     const co2Device = location.co2Devices[0];
//     const ph3Device = location.ph3Devices[0];
    
//     const co2Status = co2Device ? getStatus(co2Device.value, thresholds, DEVICE_TYPES.CO2) : "inactive";
//     const phosphineStatus = ph3Device ? getStatus(ph3Device.value, thresholds, DEVICE_TYPES.PH3) : "inactive";

//     return (
//       <Col xs={24} sm={12} md={8} lg={6} key={location.id}>
//         <Card
//           style={{
//             height: "300px", // Increased height to accommodate date display
//             border: `2px solid ${getStatusColor(overallStatus)}`,
//             borderRadius: "10px",
//             boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
//             overflow: "hidden",
//           }}
//           bodyStyle={{
//             padding: "12px",
//             height: "100%",
//             display: "flex",
//             flexDirection: "column",
//           }}
//         >
//           {/* Card Header */}
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "flex-start",
//               marginBottom: "8px",
//             }}
//           >
//             <div>
//               <Text strong style={{ fontSize: "16px", display: "block" }}>
//                 {"Location"}-{location.name}
//               </Text>
//             </div>
//             {/* DateTime display - Full Date and Time */}
//             <div style={{ textAlign: "right", maxWidth: "120px" }}>
//               {formattedDateTime ? (
//                 <Tooltip title={`Last Updated: ${formattedDateTime.full}`}>
//                   <div
//                     style={{
//                       backgroundColor: "#1890ff",
//                       borderRadius: "4px",
//                       padding: "0px 3px",
//                       cursor: "pointer",
//                     }}
//                   >
//                     <Space direction="vertical" size={0} align="end">
//                       <Space size={4}>
//                         <CalendarOutlined style={{ fontSize: "10px", color: "white" }} />
//                         <Text style={{ fontSize: "10px", color: "white", fontWeight: "bold" }}>
//                           {formattedDateTime.date}
//                         </Text>
//                         <Text style={{ fontSize: "10px", color: "white", fontWeight: "bold" }}>
//                           {formattedDateTime.time}
//                         </Text>
//                       </Space>
//                     </Space>
//                   </div>
//                 </Tooltip>
//               ) : (
//                 <Tooltip title="No data available">
//                   <Tag
//                     icon={<ExclamationCircleOutlined />}
//                     color="default"
//                     style={{
//                       fontSize: "10px",
//                       padding: "4px 6px",
//                       margin: 0,
//                       cursor: "pointer",
//                     }}
//                   >
//                     No Data
//                   </Tag>
//                 </Tooltip>
//               )}
//             </div>
//           </div>

//           {/* IP Addresses - Two columns */}
//           <Row gutter={[8, 8]} style={{ marginBottom: "16px" }}>
//             {/* CO2 Device */}
//             <Col span={12}>
//               <div
//                 style={{
//                   padding: "6px 8px",
//                   backgroundColor: co2Status === "inactive" ? "#f5f5f5" : "#e6f7ff",
//                   borderRadius: "4px",
//                   border: `1px solid ${getStatusColor(co2Status)}30`,
//                 }}
//               >
//                 <Space direction="vertical" size={2} style={{ width: "100%" }}>
//                   <Space size={4}>
//                     <CloudOutlined
//                       style={{ 
//                         fontSize: "12px", 
//                         color: co2Status === "inactive" ? STATUS_COLORS.inactive : "#1890ff" 
//                       }}
//                     />
//                     <Text strong style={{ fontSize: "11px", color: co2Status === "inactive" ? "#666" : "#000" }}>
//                       CO₂ Device
//                     </Text>
//                   </Space>
//                   <Text
//                     style={{
//                       fontSize: "11px",
//                       fontFamily: "monospace",
//                       color: co2Status === "inactive" ? "#999" : "#000",
//                       wordBreak: "break-all",
//                     }}
//                   >
//                     IP: {co2Device?.ipAddress || "N/A"}
//                   </Text>
//                 </Space>
//               </div>
//             </Col>

//             {/* Phosphine Device */}
//             <Col span={12}>
//               <div
//                 style={{
//                   padding: "6px 8px",
//                   backgroundColor: phosphineStatus === "inactive" ? "#f5f5f5" : "#f6ffed",
//                   borderRadius: "4px",
//                   border: `1px solid ${getStatusColor(phosphineStatus)}30`,
//                 }}
//               >
//                 <Space direction="vertical" size={2} style={{ width: "100%" }}>
//                   <Space size={4}>
//                     <CloudOutlined
//                       style={{ 
//                         fontSize: "12px", 
//                         color: phosphineStatus === "inactive" ? STATUS_COLORS.inactive : "#52c41a" 
//                       }}
//                     />
//                     <Text strong style={{ fontSize: "11px", color: phosphineStatus === "inactive" ? "#666" : "#000" }}>
//                       PH₃ Device
//                     </Text>
//                   </Space>
//                   <Text
//                     style={{
//                       fontSize: "11px",
//                       fontFamily: "monospace",
//                       color: phosphineStatus === "inactive" ? "#999" : "#000",
//                       wordBreak: "break-all",
//                     }}
//                   >
//                     IP: {ph3Device?.ipAddress || "N/A"}
//                   </Text>
//                 </Space>
//               </div>
//             </Col>
//           </Row>

//           {/* Gauge Display - Two gauges side by side */}
//           <div
//             style={{
//               flex: 1,
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "center",
//               marginBottom: "12px",
//             }}
//           >
//             {/* CO2 Gauge */}
//             <div style={{ width: "48%", textAlign: "center" }}>
//               {co2Device ? (
//                 <>
//                   <RadialGauge
//                     value={co2Device.value}
//                     thresholds={thresholds}
//                     deviceTypeId={DEVICE_TYPES.CO2}
//                   />
//                   <div
//                     style={{
//                       marginTop: "8px",
//                       padding: "4px 6px",
//                       backgroundColor: co2Status === "inactive" ? "#f5f5f5" : `${getStatusColor(co2Status)}15`,
//                       borderRadius: "4px",
//                       border: `1px solid ${co2Status === "inactive" ? STATUS_COLORS.inactive : getStatusColor(co2Status)}30`,
//                     }}
//                   >
//                     <Space direction="vertical" size={2} align="center">
//                       <Text
//                         strong
//                         style={{
//                           fontSize: "12px",
//                           color: getStatusColor(co2Status),
//                         }}
//                       >
//                         CO₂: {co2Status === "inactive" ? "INACTIVE" : co2Status.toUpperCase()}
//                       </Text>
//                       <Text
//                         type="secondary"
//                         style={{ fontSize: "10px", color: "black" }}
//                       >
//                         {co2Status === "inactive" ? "Offline" : `${co2Device.value} ppm`}
//                       </Text>
//                     </Space>
//                   </div>
//                 </>
//               ) : (
//                 <div
//                   style={{
//                     height: "80px",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     flexDirection: "column",
//                   }}
//                 >
//                   <ExclamationCircleOutlined style={{ fontSize: "24px", color: STATUS_COLORS.inactive }} />
//                   <Text type="secondary" style={{ fontSize: "12px", marginTop: "8px" }}>
//                     No CO₂ Device
//                   </Text>
//                 </div>
//               )}
//             </div>

//             {/* Divider */}
//             <Divider
//               type="vertical"
//               style={{ height: "80px", margin: "0 4px" }}
//             />

//             {/* Phosphine Gauge */}
//             <div style={{ width: "48%", textAlign: "center" }}>
//               {ph3Device ? (
//                 <>
//                   <RadialGauge
//                     value={ph3Device.value}
//                     thresholds={thresholds}
//                     deviceTypeId={DEVICE_TYPES.PH3}
//                   />
//                   <div
//                     style={{
//                       marginTop: "8px",
//                       padding: "4px 6px",
//                       backgroundColor: phosphineStatus === "inactive" ? "#f5f5f5" : `${getStatusColor(phosphineStatus)}15`,
//                       borderRadius: "4px",
//                       border: `1px solid ${phosphineStatus === "inactive" ? STATUS_COLORS.inactive : getStatusColor(phosphineStatus)}30`,
//                     }}
//                   >
//                     <Space direction="vertical" size={2} align="center">
//                       <Text
//                         strong
//                         style={{
//                           fontSize: "12px",
//                           color: getStatusColor(phosphineStatus),
//                         }}
//                       >
//                         PH₃: {phosphineStatus === "inactive" ? "INACTIVE" : phosphineStatus.toUpperCase()}
//                       </Text>
//                       <Text
//                         type="secondary"
//                         style={{ fontSize: "10px", color: "black" }}
//                       >
//                         {phosphineStatus === "inactive" ? "Offline" : `${ph3Device.value.toFixed(2)} ppm`}
//                       </Text>
//                     </Space>
//                   </div>
//                 </>
//               ) : (
//                 <div
//                   style={{
//                     height: "80px",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     flexDirection: "column",
//                   }}
//                 >
//                   <ExclamationCircleOutlined style={{ fontSize: "24px", color: STATUS_COLORS.inactive }} />
//                   <Text type="secondary" style={{ fontSize: "12px", marginTop: "8px" }}>
//                     No PH₃ Device
//                   </Text>
//                 </div>
//               )}
//             </div>
//           </div>
//         </Card>
//       </Col>
//     );
//   };

//   // Render a location card with multiple devices (like 3B with 4 devices)
//   const renderMultiDeviceLocationCard = (location) => {
//     const overallStatus = getOverallLocationStatus(location.devices, thresholds);
//     const latestDateTime = getLatestDateTime(location.devices);
//     const formattedDateTime = formatDateTime(latestDateTime);
//     const totalDevices = location.devices.length;
    
//     // Increased height to accommodate date display
//     const cardHeight = "300px";

//     return (
//       // Changed from lg={6} to lg={12} to make it take 2 columns instead of 1
//       <Col xs={24} sm={12} md={12} lg={12} key={location.id}>
//         <Card
//           style={{
//             height: cardHeight,
//             border: `2px solid ${getStatusColor(overallStatus)}`,
//             borderRadius: "10px",
//             boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
//             overflow: "hidden",
//           }}
//           bodyStyle={{
//             padding: "12px",
//             height: "100%",
//             display: "flex",
//             flexDirection: "column",
//           }}
//         >
//           {/* Card Header */}
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "flex-start",
//               marginBottom: "8px",
//             }}
//           >
//             <div>
//               <Text strong style={{ fontSize: "16px", display: "block" }}>
//                 {"Location"}-{location.name}
//               </Text>
//             </div>
//             {/* DateTime display - Full Date and Time */}
//             <div style={{ textAlign: "right", maxWidth: "120px" }}>
//               {formattedDateTime ? (
//                 <Tooltip title={`Last Updated: ${formattedDateTime.full}`}>
//                   <div
//                     style={{
//                       backgroundColor: "#1890ff",
//                       borderRadius: "4px",
//                       padding: "0px 3px",
//                       cursor: "pointer",
//                     }}
//                   >
//                     <Space direction="vertical" size={0} align="end">
//                       <Space size={4}>
//                         <CalendarOutlined style={{ fontSize: "10px", color: "white" }} />
//                         <Text style={{ fontSize: "10px", color: "white", fontWeight: "bold" }}>
//                           {formattedDateTime.date}
//                         </Text>
//                         <Text style={{ fontSize: "10px", color: "white", fontWeight: "bold" }}>
//                           {formattedDateTime.time}
//                         </Text>
//                       </Space>
//                     </Space>
//                   </div>
//                 </Tooltip>
//               ) : (
//                 <Tooltip title="No data available">
//                   <Tag
//                     icon={<ExclamationCircleOutlined />}
//                     color="default"
//                     style={{
//                       fontSize: "10px",
//                       padding: "4px 6px",
//                       margin: 0,
//                       cursor: "pointer",
//                     }}
//                   >
//                     No Data
//                   </Tag>
//                 </Tooltip>
//               )}
//             </div>
//           </div>

//           {/* IP Addresses - 4 columns for 4 devices */}
//           <div style={{ marginBottom: "16px" }}>
//             <Row gutter={[8, 8]}>
//               {location.devices.map((device, index) => {
//                 const status = getStatus(device.value, thresholds, device.deviceTypeId);
//                 return (
//                   <Col span={6} key={`device-ip-${index}`}>
//                     <div
//                       style={{
//                         padding: "6px 8px",
//                         backgroundColor: status === "inactive" ? "#f5f5f5" : 
//                                        (device.deviceTypeId === DEVICE_TYPES.CO2 ? "#e6f7ff" : "#f6ffed"),
//                         borderRadius: "4px",
//                         border: `1px solid ${getStatusColor(status)}30`,
//                         height: "100%",
//                       }}
//                     >
//                       <Space direction="vertical" size={2} style={{ width: "100%" }}>
//                         <Space size={4}>
//                           <CloudOutlined
//                             style={{ 
//                               fontSize: "12px", 
//                               color: status === "inactive" ? STATUS_COLORS.inactive : 
//                                      (device.deviceTypeId === DEVICE_TYPES.CO2 ? "#1890ff" : "#52c41a") 
//                             }}
//                           />
//                           <Text strong style={{ 
//                             fontSize: "10px",
//                             color: status === "inactive" ? "#666" : "#000"
//                           }}>
//                             {device.deviceTypeId === DEVICE_TYPES.CO2 ? "CO₂" : "PH₃"} {location.hasMultipleDevices ? `#${index + 1}` : ""}
//                           </Text>
//                         </Space>
//                         <Text
//                           style={{
//                             fontSize: "10px",
//                             fontFamily: "monospace",
//                             color: status === "inactive" ? "#999" : "#000",
//                             wordBreak: "break-all",
//                           }}
//                         >
//                          IP: {device.ipAddress || "N/A"}
//                         </Text>
//                       </Space>
//                     </div>
//                   </Col>
//                 );
//               })}
//             </Row>
//           </div>

//           {/* Gauge Display - All 4 gauges in one row */}
//           <div
//             style={{
//               flex: 1,
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "center",
//             }}
//           >
//             {location.devices.map((device, index) => {
//               const status = getStatus(device.value, thresholds, device.deviceTypeId);
//               return (
//                 <React.Fragment key={`gauge-container-${index}`}>
//                   <div style={{ width: "25%", textAlign: "center" }}>
//                     <RadialGauge
//                       value={device.value}
//                       thresholds={thresholds}
//                       deviceTypeId={device.deviceTypeId}
//                     />
//                     <div
//                       style={{
//                         marginTop: "8px",
//                         padding: "4px 6px",
//                         backgroundColor: status === "inactive" ? "#f5f5f5" : `${getStatusColor(status)}15`,
//                         borderRadius: "4px",
//                         border: `1px solid ${status === "inactive" ? STATUS_COLORS.inactive : getStatusColor(status)}30`,
//                       }}
//                     >
//                       <Space direction="vertical" size={2} align="center">
//                         <Text
//                           strong
//                           style={{
//                             fontSize: "12px",
//                             color: getStatusColor(status),
//                           }}
//                         >
//                           {device.deviceTypeId === DEVICE_TYPES.CO2 ? "CO₂" : "PH₃"}: {status === "inactive" ? "INACTIVE" : status.toUpperCase()}
//                         </Text>
//                         <Text
//                           type="secondary"
//                           style={{ fontSize: "10px", color: "black" }}
//                         >
//                           {status === "inactive" ? "Offline" : `${device.deviceTypeId === DEVICE_TYPES.CO2 ? device.value : device.value.toFixed(2)} ppm`}
//                         </Text>
//                       </Space>
//                     </div>
//                   </div>
//                   {index < location.devices.length - 1 && (
//                     <Divider
//                       type="vertical"
//                       style={{ height: "80px", margin: "0 4px" }}
//                     />
//                   )}
//                 </React.Fragment>
//               );
//             })}
//           </div>
//         </Card>
//       </Col>
//     );
//   };

//   // Main render function for location card
//   const renderLocationCard = (location) => {
//     if (location.hasMultipleDevices && location.totalDevices > 2) {
//       return renderMultiDeviceLocationCard(location);
//     } else {
//       return renderStandardLocationCard(location);
//     }
//   };

//   if (loading && processedLocations.length === 0) {
//     return (
//       <div style={{ 
//         display: "flex", 
//         justifyContent: "center", 
//         alignItems: "center", 
//         minHeight: "100vh" 
//       }}>
//         <Spin size="large" tip="Loading dashboard data..." />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div style={{ padding: "20px" }}>
//         <Alert
//           message="Error"
//           description={error}
//           type="error"
//           showIcon
//           action={
//             <Button size="small" onClick={fetchData}>
//               Retry
//             </Button>
//           }
//         />
//       </div>
//     );
//   }

//   return (
//     <div
//       style={{
//         padding: "16px",
//         backgroundColor: "#f5f7fa",
//         minHeight: "100vh",
//       }}
//     >
//       {/* Header Section */}
//       <div style={{ marginBottom: 16 }}>
//         <Row gutter={[16, 16]} align="middle" justify="space-between">
//           <Col>
//             <Title
//               level={3}
//               style={{ margin: 0, display: "flex", alignItems: "center" }}
//             >
//               <PieChartOutlined style={{ marginRight: 8, color: "#1890ff" }} />
//               Display Dashboard
//             </Title>
//             <Text type="secondary" style={{ fontSize: "12px" }}>
//               Real-time monitoring of CO₂ and Phosphine levels across all godowns
//             </Text>
//           </Col>
//           <Col>
//             <Space wrap>
//               {/* Search Bar */}
//               <Input
//                 placeholder="Search location, IP, value..."
//                 prefix={<SearchOutlined />}
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 style={{ width: 200 }}
//                 size="small"
//                 allowClear
//                 suffix={
//                   searchTerm && (
//                     <ClearOutlined
//                       onClick={handleClearSearch}
//                       style={{ cursor: "pointer", color: "#999" }}
//                     />
//                   )
//                 }
//               />
              
//               {/* Search Results Count Badge */}
//               {searchTerm && (
//                 <Badge
//                   count={filteredLocations.length}
//                   style={{ 
//                     backgroundColor: filteredLocations.length > 0 ? '#1890ff' : '#f5222d',
//                     marginRight: 8 
//                   }}
//                 />
//               )}
              
//               <Button
//                 type="primary"
//                 icon={<ReloadOutlined />}
//                 onClick={handleRefresh}
//                 size="small"
//                 loading={loading}
//               >
//                 Refresh
//               </Button>
//             </Space>
//           </Col>
//         </Row>

//         {/* Search Status Info */}
//         {searchTerm && (
//           <Alert
//             message={
//               <span>
//                 Showing <strong>{filteredLocations.length}</strong> of{" "}
//                 <strong>{processedLocations.length}</strong> locations matching "
//                 <strong>{searchTerm}</strong>"
//                 {filteredLocations.length === 0 && (
//                   <span> - No matching results found</span>
//                 )}
//               </span>
//             }
//             type={filteredLocations.length > 0 ? "info" : "warning"}
//             showIcon
//             style={{ marginTop: 12, fontSize: "12px" }}
//             action={
//               searchTerm && (
//                 <Button size="small" type="link" onClick={handleClearSearch}>
//                   Clear Search
//                 </Button>
//               )
//             }
//           />
//         )}

//         {/* Site Information */}
//         <Card
//           size="small"
//           style={{
//             marginTop: 12,
//             backgroundColor: "#e6f7ff",
//             borderColor: "#91d5ff",
//           }}
//         >
//           <Row align="middle" justify="space-between">
//             <Col>
//               <Space>
//                 <EnvironmentOutlined
//                   style={{ fontSize: 16, color: "#1890ff" }}
//                 />
//                 <div>
//                   <Title level={5} style={{ margin: 0 }}>
//                     {selectedSite}
//                   </Title>
//                   <Text type="secondary" style={{ fontSize: "11px" }}>
//                     {filteredLocations.length} Godowns •{" "}
//                     {searchTerm
//                       ? `Filtered from ${processedLocations.length} total`
//                       : `Total ${processedLocations.length}`}{" "}
//                     • Last Updated: {new Date().toLocaleTimeString()}
//                   </Text>
//                 </div>
//               </Space>
//             </Col>
//             {/* <Col>
//               <Space>
//                 <Tooltip title="Normal Status">
//                   <Badge
//                     status="success"
//                     text={
//                       <span style={{ fontSize: "12px" }}>
//                         {summary.normalCount} Normal
//                       </span>
//                     }
//                   />
//                 </Tooltip>
//                 <Tooltip title="Severe Status">
//                   <Badge
//                     status="warning"
//                     text={
//                       <span style={{ fontSize: "12px" }}>
//                         {summary.severeCount} Severe
//                       </span>
//                     }
//                   />
//                 </Tooltip>
//                 <Tooltip title="Critical Status">
//                   <Badge
//                     status="error"
//                     text={
//                       <span style={{ fontSize: "12px" }}>
//                         {summary.criticalCount} Critical
//                       </span>
//                     }
//                   />
//                 </Tooltip>
//                 <Tooltip title="Inactive Status">
//                   <Badge
//                     status="default"
//                     text={
//                       <span style={{ fontSize: "12px" }}>
//                         {summary.inactiveCount} Inactive
//                       </span>
//                     }
//                   />
//                 </Tooltip>
//               </Space>
//             </Col> */}
//           </Row>
//         </Card>
//       </div>

//       {/* Legend Section */}
//       <Card size="small" style={{ marginBottom: 16, fontSize: "11px" }}>
//         <Row gutter={[8, 8]} justify="center">
//           <Col xs={24} md={6}>
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//               }}
//             >
//               <div
//                 style={{
//                   width: 12,
//                   height: 12,
//                   borderRadius: "50%",
//                   backgroundColor: STATUS_COLORS.normal,
//                   marginRight: 6,
//                 }}
//               />
//               <Text>
//                 Normal (CO₂ {getThresholdText(DEVICE_TYPES.CO2, 'normal')}, PH₃{" "}
//                 {getThresholdText(DEVICE_TYPES.PH3, 'normal')})
//               </Text>
//             </div>
//           </Col>
//           <Col xs={24} md={6}>
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//               }}
//             >
//               <div
//                 style={{
//                   width: 12,
//                   height: 12,
//                   borderRadius: "50%",
//                   backgroundColor: STATUS_COLORS.severe,
//                   marginRight: 6,
//                 }}
//               />
//               <Text>
//                 Severe (CO₂ {getThresholdText(DEVICE_TYPES.CO2, 'severe')}, PH₃{" "}
//                 {getThresholdText(DEVICE_TYPES.PH3, 'severe')})
//               </Text>
//             </div>
//           </Col>
//           <Col xs={24} md={6}>
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//               }}
//             >
//               <div
//                 style={{
//                   width: 12,
//                   height: 12,
//                   borderRadius: "50%",
//                   backgroundColor: STATUS_COLORS.critical,
//                   marginRight: 6,
//                 }}
//               />
//               <Text>
//                 Critical (CO₂ {getThresholdText(DEVICE_TYPES.CO2, 'critical')}, PH₃{" "}
//                 {getThresholdText(DEVICE_TYPES.PH3, 'critical')})
//               </Text>
//             </div>
//           </Col>
//           <Col xs={24} md={6}>
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//               }}
//             >
//               <div
//                 style={{
//                   width: 12,
//                   height: 12,
//                   borderRadius: "50%",
//                   backgroundColor: STATUS_COLORS.inactive,
//                   marginRight: 6,
//                 }}
//               />
//               <Text>
//                 Inactive (Device Offline)
//               </Text>
//             </div>
//           </Col>
//         </Row>
//       </Card>

//       {/* Godown Cards Grid */}
//       {filteredLocations.length > 0 ? (
//         <Row gutter={[16, 16]}>
//           {filteredLocations.map((location) => renderLocationCard(location))}
//         </Row>
//       ) : (
//         <Alert
//           message={searchTerm ? "No Matching Results" : "No Data Available"}
//           description={
//             searchTerm
//               ? `No godowns found matching "${searchTerm}". Try a different search term or clear the search.`
//               : "There are no godowns with device data to display."
//           }
//           type={searchTerm ? "warning" : "info"}
//           showIcon
//           style={{ margin: "20px 0" }}
//           action={
//             searchTerm && (
//               <Button size="small" onClick={handleClearSearch}>
//                 Clear Search
//               </Button>
//             )
//           }
//         />
//       )}

//       <div
//         style={{
//           marginTop: 16,
//           textAlign: "center",
//           padding: "12px 0",
//           borderTop: "1px solid #f0f0f0",
//           fontSize: "12px",
//           color: "#666",
//         }}
//       >
//         <Text type="secondary">
//           Display Dashboard • {selectedSite} •{" "}
//           {searchTerm
//             ? `Showing ${filteredLocations.length} filtered locations • `
//             : ""}
//           Auto-refresh every 30 seconds • Last Updated:{" "}
//           {new Date().toLocaleTimeString()} • Total Devices:{" "}
//           {filteredLocations.reduce((total, loc) => {
//             return total + (loc.devices ? loc.devices.length : 0);
//           }, 0)}
//         </Text>
//       </div>

//       <div className="fixed bottom-2 left-4 text-xs font-bold z-50 pointer-events-none">
//       </div>
//     </div>
//   );
// };

// export default DisplayDashboard;


//---------------------------------below code is default showing color of orange and red ------------

// import React, { useState, useEffect } from "react";
// import {
//   Row,
//   Col,
//   Card,
//   Typography,
//   Space,
//   Divider,
//   Select,
//   Tooltip,
//   Button,
//   Badge,
//   Tag,
//   Statistic,
//   Spin,
//   Alert,
//   Input,
// } from "antd";
// import {
//   PieChartOutlined,
//   EnvironmentOutlined,
//   ReloadOutlined,
//   InfoCircleOutlined,
//   WarningOutlined,
//   SafetyOutlined,
//   WifiOutlined,
//   CloudOutlined,
//   ExclamationCircleOutlined,
//   SearchOutlined,
//   ClearOutlined,
//   CalendarOutlined,
//   ClockCircleOutlined,
// } from "@ant-design/icons";
// import { CO2API, gasFetch } from "../../../config";

// const { Title, Text } = Typography;
// const { Option } = Select;
// const { Search } = Input;

// // Color scheme for different status levels
// const STATUS_COLORS = {
//   normal: "#52c41a", // Green
//   severe: "#faad14", // Orange
//   critical: "#f5222d", // Red
//   inactive: "#8c8c8c", // Gray for inactive
//   default: "#d9d9d9", // Gray
// };

// // DateTime background colors based on card status
// const DATETIME_BG_COLORS = {
//   normal: {
//     light: "#d9f7be", // Light green
//     dark: "#52c41a", // Dark green for text/icons
//     border: "#b7eb8f",
//   },
//   severe: {
//     light: "#fff1b8", // Light orange
//     dark: "#fa8c16", // Dark orange for text/icons
//     border: "#ffd666",
//   },
//   critical: {
//     light: "#ffccc7", // Light red
//     dark: "#ff4d4f", // Dark red for text/icons
//     border: "#ffa39e",
//   },
//   inactive: {
//     light: "#f5f5f5", // Light gray
//     dark: "#8c8c8c", // Dark gray for text/icons
//     border: "#d9d9d9",
//   },
//   default: {
//     light: "#e6f7ff", // Light blue
//     dark: "#1890ff", // Blue for text/icons
//     border: "#91d5ff",
//   },
// };

// // Device type constants
// const DEVICE_TYPES = {
//   CO2: 30000,
//   PH3: 30001,
// };

// // Static thresholds (will be replaced by API data)
// const DEFAULT_THRESHOLDS = {
//   [DEVICE_TYPES.CO2]: {
//     normal: { min: 0, max: 600 },
//     severe: { min: 600, max: 1500 },
//     critical: { min: 1500, max: 5500 },
//   },
//   [DEVICE_TYPES.PH3]: {
//     normal: { min: 0, max: 3 },
//     severe: { min: 3, max: 7.5 },
//     critical: { min: 7.5, max: 25 },
//   },
// };

// // Determine status based on value and thresholds
// const getStatus = (value, thresholds, deviceTypeId) => {
//   // Handle inactive devices (null values)
//   if (value === null || value === undefined) {
//     return "inactive";
//   }
  
//   if (!thresholds[deviceTypeId]) {
//     // Fallback to default thresholds if API data not loaded
//     const defaultThresholds = DEFAULT_THRESHOLDS[deviceTypeId];
//     if (value <= defaultThresholds.normal.max) return "normal";
//     if (value <= defaultThresholds.severe.max) return "severe";
//     return "critical";
//   }

//   if (value <= thresholds[deviceTypeId].normal.max) return "normal";
//   if (value <= thresholds[deviceTypeId].severe.max) return "severe";
//   return "critical";
// };

// // Get overall location status based on both CO2 and Phosphine
// const getOverallLocationStatus = (locationData, thresholds) => {
//   if (!locationData || locationData.length === 0) return "default";

//   let co2Status = "default";
//   let ph3Status = "default";

//   locationData.forEach((device) => {
//     const status = getStatus(device.value, thresholds, device.deviceTypeId);
//     if (device.deviceTypeId === DEVICE_TYPES.CO2) {
//       co2Status = status;
//     } else if (device.deviceTypeId === DEVICE_TYPES.PH3) {
//       ph3Status = status;
//     }
//   });

//   // Return the worst status
//   if (co2Status === "critical" || ph3Status === "critical") return "critical";
//   if (co2Status === "severe" || ph3Status === "severe") return "severe";
//   if (co2Status === "normal" || ph3Status === "normal") return "normal";
//   if (co2Status === "inactive" || ph3Status === "inactive") return "inactive";
//   return "default";
// };

// // Get status color
// const getStatusColor = (status) =>
//   STATUS_COLORS[status] || STATUS_COLORS.default;

// // Get status icon
// const getStatusIcon = (status) => {
//   switch (status) {
//     case "normal":
//       return (
//         <SafetyOutlined
//           style={{ color: STATUS_COLORS.normal, fontSize: "14px" }}
//         />
//       );
//     case "severe":
//       return (
//         <WarningOutlined
//           style={{ color: STATUS_COLORS.severe, fontSize: "14px" }}
//         />
//       );
//     case "critical":
//       return (
//         <WarningOutlined
//           style={{ color: STATUS_COLORS.critical, fontSize: "14px" }}
//         />
//       );
//     case "inactive":
//       return (
//         <ExclamationCircleOutlined
//           style={{ color: STATUS_COLORS.inactive, fontSize: "14px" }}
//         />
//       );
//     default:
//       return null;
//   }
// };

// // Get the latest dateTime from devices in a location
// const getLatestDateTime = (devices) => {
//   if (!devices || devices.length === 0) return null;
  
//   // Filter out null dateTimes
//   const validDateTimes = devices
//     .map(device => device.dateTime)
//     .filter(dateTime => dateTime !== null);
    
//   if (validDateTimes.length === 0) return null;
  
//   // Find the latest dateTime
//   const latest = validDateTimes.reduce((latest, current) => {
//     return new Date(current) > new Date(latest) ? current : latest;
//   }, validDateTimes[0]);
  
//   return latest;
// };

// // Format date time for display
// const formatDateTime = (dateTimeString) => {
//   if (!dateTimeString) return null;
  
//   try {
//     const date = new Date(dateTimeString);
//     return {
//       date: date.toLocaleDateString('en-GB', { 
//         day: '2-digit', 
//         month: 'short', 
//         year: 'numeric' 
//       }),
//       time: date.toLocaleTimeString('en-GB', { 
//         hour: '2-digit', 
//         minute: '2-digit',
//         hour12: false 
//       }),
//       full: date.toLocaleString('en-GB', {
//         day: '2-digit',
//         month: 'short',
//         year: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit',
//         hour12: false
//       })
//     };
//   } catch (error) {
//     console.error('Error formatting date:', error);
//     return null;
//   }
// };

// // Radial Gauge Component
// const RadialGauge = ({ value, thresholds, deviceTypeId, maxValue = null }) => {
//   const status = getStatus(value, thresholds, deviceTypeId);
  
//   // Handle inactive devices
//   if (status === "inactive") {
//     return (
//       <div
//         style={{
//           position: "relative",
//           width: "80px",
//           height: "80px",
//           margin: "0 auto",
//         }}
//       >
//         <div
//           style={{
//             position: "absolute",
//             width: "80px",
//             height: "80px",
//             borderRadius: "50%",
//             background: STATUS_COLORS.inactive,
//             opacity: 0.3,
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//           }}
//         >
//           <ExclamationCircleOutlined 
//             style={{ 
//               fontSize: "24px", 
//               color: STATUS_COLORS.inactive 
//             }} 
//           />
//         </div>
//         <div
//           style={{
//             position: "absolute",
//             width: "60px",
//             height: "60px",
//             borderRadius: "50%",
//             background: "white",
//             top: "10px",
//             left: "10px",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
//           }}
//         >
//           <div style={{ textAlign: "center" }}>
//             <div
//               style={{
//                 fontSize: "14px",
//                 fontWeight: "bold",
//                 color: STATUS_COLORS.inactive,
//               }}
//             >
//               Offline
//             </div>
//             <div style={{ fontSize: "10px", color: "#666" }}>Device</div>
//           </div>
//         </div>
//       </div>
//     );
//   }
  
//   // Determine max value for percentage calculation
//   let maxValueForGauge = maxValue;
//   if (!maxValueForGauge && thresholds[deviceTypeId]) {
//     maxValueForGauge = thresholds[deviceTypeId].critical.max;
//   } else if (!maxValueForGauge) {
//     maxValueForGauge = deviceTypeId === DEVICE_TYPES.CO2 ? 5500 : 25;
//   }
  
//   const percentage = Math.min(100, (value / maxValueForGauge) * 100);

//   return (
//     <div
//       style={{
//         position: "relative",
//         width: "80px",
//         height: "80px",
//         margin: "0 auto",
//       }}
//     >
//       {/* Outer ring */}
//       <div
//         style={{
//           position: "absolute",
//           width: "80px",
//           height: "80px",
//           borderRadius: "50%",
//           background: `conic-gradient(${getStatusColor(
//             status
//           )} 0% ${percentage}%, #f5f5f5 ${percentage}% 100%)`,
//           boxShadow: `0 0 8px ${getStatusColor(status)}40`,
//         }}
//       />

//       {/* Inner circle */}
//       <div
//         style={{
//           position: "absolute",
//           width: "60px",
//           height: "60px",
//           borderRadius: "50%",
//           background: "white",
//           top: "10px",
//           left: "10px",
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "center",
//           boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
//         }}
//       >
//         <div style={{ textAlign: "center" }}>
//           <div
//             style={{
//               fontSize: deviceTypeId === DEVICE_TYPES.CO2 ? "16px" : "14px",
//               fontWeight: "bold",
//               color: getStatusColor(status),
//             }}
//           >
//             {deviceTypeId === DEVICE_TYPES.CO2 ? value : value.toFixed(2)}
//           </div>
//           <div style={{ fontSize: "10px", color: "#666" }}>ppm</div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // DateTime Display Component
// const DateTimeDisplay = ({ dateTime, status = "default" }) => {
//   const formattedDateTime = formatDateTime(dateTime);
//   const colorTheme = DATETIME_BG_COLORS[status] || DATETIME_BG_COLORS.default;

//   return (
//     <Tooltip title={`Last Updated: ${formattedDateTime ? formattedDateTime.full : "No data"}`}>
//       <div
//         style={{
//           backgroundColor: colorTheme.light,
//           borderRadius: "6px",
//           padding: "2px 6px",
//           border: `1px solid ${colorTheme.border}`,
//           display: "inline-flex",
//           alignItems: "center",
//           gap: "4px",
//           cursor: "pointer",
//           transition: "all 0.2s ease",
//           minWidth: "110px",
//           justifyContent: "center",
//           height: "28px",
//           boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
//         }}
//         onMouseEnter={(e) => {
//           e.currentTarget.style.transform = "translateY(-1px)";
//           e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
//         }}
//         onMouseLeave={(e) => {
//           e.currentTarget.style.transform = "translateY(0)";
//           e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)";
//         }}
//       >
//         {formattedDateTime ? (
//           <Space size={2} align="center">
//             <CalendarOutlined style={{ 
//               fontSize: "10px", 
//               color: colorTheme.dark,
//               fontWeight: "bold" 
//             }} />
//             <Text style={{ 
//               fontSize: "11px", 
//               color: colorTheme.dark,
//               fontWeight: "bold" 
//             }}>
//               {formattedDateTime.date}
//             </Text>
//             <Text style={{ 
//               fontSize: "11px", 
//               color: colorTheme.dark,
//               fontWeight: "bold" 
//             }}>
//               {formattedDateTime.time}
//             </Text>
//           </Space>
//         ) : (
//           <Space size={2} align="center">
//             <ExclamationCircleOutlined style={{ 
//               fontSize: "10px", 
//               color: colorTheme.dark 
//             }} />
//             <Text style={{ 
//               fontSize: "11px", 
//               color: colorTheme.dark,
//               fontWeight: "bold" 
//             }}>
//               No Data
//             </Text>
//           </Space>
//         )}
//       </div>
//     </Tooltip>
//   );
// };

// // DisplayDashboard Component
// const DisplayDashboard = () => {
//   const [selectedSite, setSelectedSite] = useState("Sonipat (Haryana)");
//   const [refreshCounter, setRefreshCounter] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [thresholds, setThresholds] = useState({});
//   const [locationData, setLocationData] = useState({});
//   const [processedLocations, setProcessedLocations] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredLocations, setFilteredLocations] = useState([]);

//   // Process thresholds data from API
//   const processThresholdsData = (apiData) => {
//     const processed = {};
    
//     apiData.forEach((item) => {
//       if (!processed[item.deviceTypeId]) {
//         processed[item.deviceTypeId] = {};
//       }
      
//       switch (item.alertType.toLowerCase()) {
//         case 'normal':
//           processed[item.deviceTypeId].normal = {
//             min: item.minValue,
//             max: item.maxValue,
//           };
//           break;
//         case 'severe':
//           processed[item.deviceTypeId].severe = {
//             min: item.minValue,
//             max: item.maxValue,
//           };
//           break;
//         case 'critical':
//           processed[item.deviceTypeId].critical = {
//             min: item.minValue,
//             max: item.maxValue,
//           };
//           break;
//         default:
//           break;
//       }
//     });
    
//     return processed;
//   };

//   // Process location data from API
//   const processLocationData = (apiData) => {
//     const processed = [];
    
//     Object.entries(apiData).forEach(([locationName, devices]) => {
//       // Group devices by type
//       const co2Devices = devices.filter(d => d.deviceTypeId === DEVICE_TYPES.CO2);
//       const ph3Devices = devices.filter(d => d.deviceTypeId === DEVICE_TYPES.PH3);
      
//       const location = {
//         id: locationName,
//         name: locationName,
//         devices: devices, // Store raw device data
//         co2Devices: co2Devices,
//         ph3Devices: ph3Devices,
//         hasMultipleCO2: co2Devices.length > 1,
//         hasMultiplePH3: ph3Devices.length > 1,
//         hasMultipleDevices: co2Devices.length > 1 || ph3Devices.length > 1,
//         totalDevices: devices.length,
//       };
      
//       processed.push(location);
//     });
    
//     // Sort locations: 2-device cards first, 4-device cards last
//     return processed.sort((a, b) => {
//       // If both have multiple devices or both don't, maintain original order
//       if (a.hasMultipleDevices === b.hasMultipleDevices) return 0;
//       // Put 2-device cards (no multiple devices) first
//       if (!a.hasMultipleDevices && b.hasMultipleDevices) return -1;
//       // Put 4-device cards (multiple devices) last
//       return 1;
//     });
//   };

//   // Fetch data from APIs
//   const fetchData = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       // Fetch thresholds
//       const thresholdsResponse = await fetch(
//         `${CO2API}/api/device-ranges`
//       );
//       const thresholdsData = await thresholdsResponse.json();
//       const processedThresholds = processThresholdsData(thresholdsData);
//       setThresholds(processedThresholds);

//       // Fetch location alerts
//       const alertsResponse = await fetch(
//         `${CO2API}/api/device-logs/alerts`
//       );
//       const alertsData = await alertsResponse.json();
//       const processedLocations = processLocationData(alertsData);
//       setLocationData(alertsData);
//       setProcessedLocations(processedLocations);
//       setFilteredLocations(processedLocations); // Initialize filtered locations
      
//     } catch (err) {
//       setError("Failed to fetch data. Please try again.");
//       console.error("Error fetching data:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Initial data fetch
//   useEffect(() => {
//     fetchData();
//   }, []);

//   // Filter locations based on search term
//   useEffect(() => {
//     if (!searchTerm.trim()) {
//       setFilteredLocations(processedLocations);
//       return;
//     }

//     const searchLower = searchTerm.toLowerCase();
//     const filtered = processedLocations.filter(location => {
//       // Search in location name
//       if (location.name.toLowerCase().includes(searchLower)) return true;
      
//       // Search in all device IP addresses
//       const allIPs = location.devices.map(d => d.ipAddress).filter(ip => ip);
//       if (allIPs.some(ip => ip.toLowerCase().includes(searchLower))) return true;
      
//       // Search in all device values
//       const allValues = location.devices.map(d => d.value ? d.value.toString() : "inactive");
//       if (allValues.some(val => val.includes(searchLower))) return true;
      
//       // Search in status
//       const overallStatus = getOverallLocationStatus(location.devices, thresholds);
//       if (overallStatus.toLowerCase().includes(searchLower)) return true;
      
//       // Search in individual device statuses
//       const allStatuses = location.devices.map(device => 
//         getStatus(device.value, thresholds, device.deviceTypeId)
//       );
//       if (allStatuses.some(status => status.toLowerCase().includes(searchLower))) return true;
      
//       return false;
//     });
    
//     setFilteredLocations(filtered);
//   }, [searchTerm, processedLocations, thresholds]);

//   // Handle search
//   const handleSearch = (value) => {
//     setSearchTerm(value);
//   };

//   // Clear search
//   const handleClearSearch = () => {
//     setSearchTerm("");
//   };

//   // Handle refresh
//   const handleRefresh = () => {
//     setSearchTerm(""); // Clear search on refresh
//     setRefreshCounter((prev) => prev + 1);
//     fetchData();
//   };

//   // Calculate summary statistics based on filtered locations
//   const calculateSummary = () => {
//     const totalGodowns = filteredLocations.length;
    
//     // Calculate averages across all devices
//     let totalCO2 = 0;
//     let totalPH3 = 0;
//     let co2Count = 0;
//     let ph3Count = 0;

//     filteredLocations.forEach((location) => {
//       location.co2Devices.forEach(device => {
//         if (device.value !== null && device.value !== undefined) {
//           totalCO2 += device.value;
//           co2Count++;
//         }
//       });
//       location.ph3Devices.forEach(device => {
//         if (device.value !== null && device.value !== undefined) {
//           totalPH3 += device.value;
//           ph3Count++;
//         }
//       });
//     });

//     const avgCO2 = co2Count > 0 ? Math.round(totalCO2 / co2Count) : 0;
//     const avgPhosphine = ph3Count > 0 ? totalPH3 / ph3Count : 0;

//     // Count statuses based on overall location status
//     let normalCount = 0;
//     let severeCount = 0;
//     let criticalCount = 0;
//     let inactiveCount = 0;

//     filteredLocations.forEach((location) => {
//       const overallStatus = getOverallLocationStatus(location.devices, thresholds);
//       if (overallStatus === "normal") normalCount++;
//       else if (overallStatus === "severe") severeCount++;
//       else if (overallStatus === "critical") criticalCount++;
//       else if (overallStatus === "inactive") inactiveCount++;
//     });

//     return {
//       totalGodowns,
//       avgCO2,
//       avgPhosphine,
//       normalCount,
//       severeCount,
//       criticalCount,
//       inactiveCount,
//     };
//   };

//   const summary = calculateSummary();

//   // Get threshold text for legend
//   const getThresholdText = (deviceTypeId, statusType) => {
//     if (!thresholds[deviceTypeId] || !thresholds[deviceTypeId][statusType]) {
//       const defaultThresholds = DEFAULT_THRESHOLDS[deviceTypeId];
//       return statusType === 'normal' 
//         ? `≤ ${defaultThresholds.normal.max} ppm`
//         : statusType === 'severe'
//         ? `≤ ${defaultThresholds.severe.max} ppm`
//         : `≤ ${defaultThresholds.critical.max} ppm`;
//     }
    
//     return `≤ ${thresholds[deviceTypeId][statusType].max} ppm`;
//   };

//   // Render a standard location card (for 2 devices)
//   const renderStandardLocationCard = (location) => {
//     const overallStatus = getOverallLocationStatus(location.devices, thresholds);
//     const latestDateTime = getLatestDateTime(location.devices);
    
//     // Get the first CO2 and PH3 devices
//     const co2Device = location.co2Devices[0];
//     const ph3Device = location.ph3Devices[0];
    
//     const co2Status = co2Device ? getStatus(co2Device.value, thresholds, DEVICE_TYPES.CO2) : "inactive";
//     const phosphineStatus = ph3Device ? getStatus(ph3Device.value, thresholds, DEVICE_TYPES.PH3) : "inactive";

//     return (
//       <Col xs={24} sm={12} md={8} lg={6} key={location.id}>
//         <Card
//           style={{
//             height: "330px",
//             border: `2px solid ${getStatusColor(overallStatus)}`,
//             borderRadius: "10px",
//             boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
//             overflow: "hidden",
//             transition: "all 0.3s ease",
//           }}
//           bodyStyle={{
//             padding: "12px",
//             height: "100%",
//             display: "flex",
//             flexDirection: "column",
//           }}
//           hoverable
//         >
//           {/* Card Header */}
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "flex-start",
//               marginBottom: "8px",
//             }}
//           >
//             <div>
//               <Text strong style={{ fontSize: "16px", display: "block" }}>
//                 {"Location"}-{location.name}
//               </Text>
//             </div>
//             {/* DateTime display */}
//             <div style={{ textAlign: "right" }}>
//               <DateTimeDisplay
//                 dateTime={latestDateTime} 
//                 status={overallStatus} 
//               />
//             </div>
//           </div>

//           {/* Device Information - Two columns showing severe and critical counts */}
//           <Row gutter={[8, 8]} style={{ marginBottom: "16px" }}>
//             {/* CO2 Device Information */}
//             <Col span={12}>
//               <div
//                 style={{
//                   padding: "6px 8px",
//                   backgroundColor: co2Status === "inactive" ? "#f5f5f5" : "#e6f7ff",
//                   borderRadius: "4px",
//                   border: `1px solid ${getStatusColor(co2Status)}30`,
//                 }}
//               >
//                 <Space direction="vertical" size={2} style={{ width: "100%" }}>
//                   <Space size={4}>
//                     <CloudOutlined
//                       style={{ 
//                         fontSize: "12px", 
//                         color: co2Status === "inactive" ? STATUS_COLORS.inactive : "#1890ff" 
//                       }}
//                     />
//                     <Text strong style={{ fontSize: "11px", color: co2Status === "inactive" ? "#666" : "#000" }}>
//                       CO₂ Device
//                     </Text>
//                   </Space>
//                   {/* Severe and Critical Counts */}
//                   <Row gutter={[4, 2]} style={{ marginTop: 2 }}>
//                     <Col span={12}>
//                       <div style={{ textAlign: "center" }}>
//                         <Text strong style={{ fontSize: "14px", color: "#faad14" }}>
//                           Severe
//                         </Text>
//                         <div style={{ fontSize: "14px", fontWeight: "bold", color: "#faad14" }}>
//                           {co2Device?.severeCount || 0}
//                         </div>
//                       </div>
//                     </Col>
//                     <Col span={12}>
//                       <div style={{ textAlign: "center" }}>
//                         <Text strong style={{ fontSize: "14px", color: "#f5222d" }}>
//                           Critical
//                         </Text>
//                         <div style={{ fontSize: "14px", fontWeight: "bold", color: "#f5222d" }}>
//                           {co2Device?.criticalCount || 0}
//                         </div>
//                       </div>
//                     </Col>
//                   </Row>
//                 </Space>
//               </div>
//             </Col>

//             {/* Phosphine Device Information */}
//             <Col span={12}>
//               <div
//                 style={{
//                   padding: "6px 8px",
//                   backgroundColor: phosphineStatus === "inactive" ? "#f5f5f5" : "#f6ffed",
//                   borderRadius: "4px",
//                   border: `1px solid ${getStatusColor(phosphineStatus)}30`,
//                 }}
//               >
//                 <Space direction="vertical" size={2} style={{ width: "100%" }}>
//                   <Space size={4}>
//                     <CloudOutlined
//                       style={{ 
//                         fontSize: "12px", 
//                         color: phosphineStatus === "inactive" ? STATUS_COLORS.inactive : "#52c41a" 
//                       }}
//                     />
//                     <Text strong style={{ fontSize: "11px", color: phosphineStatus === "inactive" ? "#666" : "#000" }}>
//                       PH₃ Device
//                     </Text>
//                   </Space>
//                   {/* Severe and Critical Counts */}
//                   <Row gutter={[4, 2]} style={{ marginTop: 2 }}>
//                     <Col span={12}>
//                       <div style={{ textAlign: "center" }}>
//                         <Text strong style={{ fontSize: "14px", color: "#faad14" }}>
//                           Severe
//                         </Text>
//                         <div style={{ fontSize: "14px", fontWeight: "bold", color: "#faad14" }}>
//                           {ph3Device?.severeCount || 0}
//                         </div>
//                       </div>
//                     </Col>
//                     <Col span={12}>
//                       <div style={{ textAlign: "center" }}>
//                         <Text strong style={{ fontSize: "14px", color: "#f5222d" }}>
//                           Critical
//                         </Text>
//                         <div style={{ fontSize: "14px", fontWeight: "bold", color: "#f5222d" }}>
//                           {ph3Device?.criticalCount || 0}
//                         </div>
//                       </div>
//                     </Col>
//                   </Row>
//                 </Space>
//               </div>
//             </Col>
//           </Row>

//           {/* Gauge Display - Two gauges side by side */}
//           <div
//             style={{
//               flex: 1,
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "center",
//               marginBottom: "12px",
//             }}
//           >
//             {/* CO2 Gauge */}
//             <div style={{ width: "48%", textAlign: "center" }}>
//               {co2Device ? (
//                 <>
//                   <RadialGauge
//                     value={co2Device.value}
//                     thresholds={thresholds}
//                     deviceTypeId={DEVICE_TYPES.CO2}
//                   />
//                   <div
//                     style={{
//                       marginTop: "8px",
//                       padding: "4px 6px",
//                       backgroundColor: co2Status === "inactive" ? "#f5f5f5" : `${getStatusColor(co2Status)}15`,
//                       borderRadius: "4px",
//                       border: `1px solid ${co2Status === "inactive" ? STATUS_COLORS.inactive : getStatusColor(co2Status)}30`,
//                     }}
//                   >
//                     <Space direction="vertical" size={2} align="center">
//                       <Text
//                         strong
//                         style={{
//                           fontSize: "12px",
//                           color: getStatusColor(co2Status),
//                         }}
//                       >
//                         CO₂: {co2Status === "inactive" ? "INACTIVE" : co2Status.toUpperCase()}
//                       </Text>
//                       <Text
//                         type="secondary"
//                         style={{ fontSize: "10px", color: "black" }}
//                       >
//                         {co2Status === "inactive" ? "Offline" : `${co2Device.value} ppm`}
//                       </Text>
//                       {/* IP Address moved to bottom */}
//                       <Text
//                         style={{
//                           fontSize: "11px",
//                           fontFamily: "monospace",
//                           color: "#666",
//                         }}
//                       >
//                         IP: {co2Device.ipAddress || "N/A"}
//                       </Text>
//                     </Space>
//                   </div>
//                 </>
//               ) : (
//                 <div
//                   style={{
//                     height: "80px",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     flexDirection: "column",
//                   }}
//                 >
//                   <ExclamationCircleOutlined style={{ fontSize: "24px", color: STATUS_COLORS.inactive }} />
//                   <Text type="secondary" style={{ fontSize: "12px", marginTop: "8px" }}>
//                     No CO₂ Device
//                   </Text>
//                 </div>
//               )}
//             </div>

//             {/* Divider */}
//             <Divider
//               type="vertical"
//               style={{ height: "80px", margin: "0 4px" }}
//             />

//             {/* Phosphine Gauge */}
//             <div style={{ width: "48%", textAlign: "center" }}>
//               {ph3Device ? (
//                 <>
//                   <RadialGauge
//                     value={ph3Device.value}
//                     thresholds={thresholds}
//                     deviceTypeId={DEVICE_TYPES.PH3}
//                   />
//                   <div
//                     style={{
//                       marginTop: "8px",
//                       padding: "4px 6px",
//                       backgroundColor: phosphineStatus === "inactive" ? "#f5f5f5" : `${getStatusColor(phosphineStatus)}15`,
//                       borderRadius: "4px",
//                       border: `1px solid ${phosphineStatus === "inactive" ? STATUS_COLORS.inactive : getStatusColor(phosphineStatus)}30`,
//                     }}
//                   >
//                     <Space direction="vertical" size={2} align="center">
//                       <Text
//                         strong
//                         style={{
//                           fontSize: "12px",
//                           color: getStatusColor(phosphineStatus),
//                         }}
//                       >
//                         PH₃: {phosphineStatus === "inactive" ? "INACTIVE" : phosphineStatus.toUpperCase()}
//                       </Text>
//                       <Text
//                         type="secondary"
//                         style={{ fontSize: "10px", color: "black" }}
//                       >
//                         {phosphineStatus === "inactive" ? "Offline" : `${ph3Device.value.toFixed(2)} ppm`}
//                       </Text>
//                       {/* IP Address moved to bottom */}
//                       <Text
//                         style={{
//                           fontSize: "11px",
//                           fontFamily: "monospace",
//                           color: "#666",
//                         }}
//                       >
//                         IP: {ph3Device.ipAddress || "N/A"}
//                       </Text>
//                     </Space>
//                   </div>
//                 </>
//               ) : (
//                 <div
//                   style={{
//                     height: "80px",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     flexDirection: "column",
//                   }}
//                 >
//                   <ExclamationCircleOutlined style={{ fontSize: "24px", color: STATUS_COLORS.inactive }} />
//                   <Text type="secondary" style={{ fontSize: "12px", marginTop: "8px" }}>
//                     No PH₃ Device
//                   </Text>
//                 </div>
//               )}
//             </div>
//           </div>
//         </Card>
//       </Col>
//     );
//   };

//   // Render a location card with multiple devices (like 3B with 4 devices)
//   const renderMultiDeviceLocationCard = (location) => {
//     const overallStatus = getOverallLocationStatus(location.devices, thresholds);
//     const latestDateTime = getLatestDateTime(location.devices);
//     const totalDevices = location.devices.length;
    
//     const cardHeight = "330px";

//     return (
//       <Col xs={24} sm={12} md={12} lg={12} key={location.id}>
//         <Card
//           style={{
//             height: cardHeight,
//             border: `2px solid ${getStatusColor(overallStatus)}`,
//             borderRadius: "10px",
//             boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
//             overflow: "hidden",
//             transition: "all 0.3s ease",
//           }}
//           bodyStyle={{
//             padding: "12px",
//             height: "100%",
//             display: "flex",
//             flexDirection: "column",
//           }}
//           hoverable
//         >
//           {/* Card Header */}
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "flex-start",
//               marginBottom: "8px",
//             }}
//           >
//             <div>
//               <Text strong style={{ fontSize: "16px", display: "block" }}>
//                 {"Location"}-{location.name}
//               </Text>
//             </div>
//             {/* DateTime display */}
//             <div style={{ textAlign: "right" }}>
//               <DateTimeDisplay 
//                 dateTime={latestDateTime} 
//                 status={overallStatus} 
//               />
//             </div>
//           </div>

//           {/* Device Information - 4 columns for 4 devices */}
//           <div style={{ marginBottom: "16px" }}>
//             <Row gutter={[8, 8]}>
//               {location.devices.map((device, index) => {
//                 const status = getStatus(device.value, thresholds, device.deviceTypeId);
//                 return (
//                   <Col span={6} key={`device-info-${index}`}>
//                     <div
//                       style={{
//                         padding: "6px 8px",
//                         backgroundColor: status === "inactive" ? "#f5f5f5" : 
//                                        (device.deviceTypeId === DEVICE_TYPES.CO2 ? "#e6f7ff" : "#f6ffed"),
//                         borderRadius: "4px",
//                         border: `1px solid ${getStatusColor(status)}30`,
//                         height: "100%",
//                       }}
//                     >
//                       <Space direction="vertical" size={2} style={{ width: "100%" }}>
//                         <Space size={4}>
//                           <CloudOutlined
//                             style={{ 
//                               fontSize: "12px", 
//                               color: status === "inactive" ? STATUS_COLORS.inactive : 
//                                      (device.deviceTypeId === DEVICE_TYPES.CO2 ? "#1890ff" : "#52c41a") 
//                             }}
//                           />
//                           <Text strong style={{ 
//                             fontSize: "10px",
//                             color: status === "inactive" ? "#666" : "#000"
//                           }}>
//                             {device.deviceTypeId === DEVICE_TYPES.CO2 ? "CO₂" : "PH₃"} {location.hasMultipleDevices ? `#${index + 1}` : ""}
//                           </Text>
//                         </Space>
//                         {/* Severe and Critical Counts */}
//                         <Row gutter={[4, 2]} style={{ marginTop: 2 }}>
//                           <Col span={12}>
//                             <div style={{ textAlign: "center" }}>
//                               <Text strong style={{ fontSize: "14px", color: "#faad14" }}>
//                                 Severe
//                               </Text>
//                               <div style={{ fontSize: "14px", fontWeight: "bold", color: "#faad14" }}>
//                                 {device.severeCount || 0}
//                               </div>
//                             </div>
//                           </Col>
//                           <Col span={12}>
//                             <div style={{ textAlign: "center" }}>
//                               <Text strong style={{ fontSize: "14px", color: "#f5222d" }}>
//                                 Critical
//                               </Text>
//                               <div style={{ fontSize: "14px", fontWeight: "bold", color: "#f5222d" }}>
//                                 {device.criticalCount || 0}
//                               </div>
//                             </div>
//                           </Col>
//                         </Row>
//                       </Space>
//                     </div>
//                   </Col>
//                 );
//               })}
//             </Row>
//           </div>

//           {/* Gauge Display - All 4 gauges in one row */}
//           <div
//             style={{
//               flex: 1,
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "center",
//             }}
//           >
//             {location.devices.map((device, index) => {
//               const status = getStatus(device.value, thresholds, device.deviceTypeId);
//               return (
//                 <React.Fragment key={`gauge-container-${index}`}>
//                   <div style={{ width: "25%", textAlign: "center" }}>
//                     <RadialGauge
//                       value={device.value}
//                       thresholds={thresholds}
//                       deviceTypeId={device.deviceTypeId}
//                     />
//                     <div
//                       style={{
//                         marginTop: "8px",
//                         padding: "4px 6px",
//                         backgroundColor: status === "inactive" ? "#f5f5f5" : `${getStatusColor(status)}15`,
//                         borderRadius: "4px",
//                         border: `1px solid ${status === "inactive" ? STATUS_COLORS.inactive : getStatusColor(status)}30`,
//                       }}
//                     >
//                       <Space direction="vertical" size={2} align="center">
//                         <Text
//                           strong
//                           style={{
//                             fontSize: "12px",
//                             color: getStatusColor(status),
//                           }}
//                         >
//                           {device.deviceTypeId === DEVICE_TYPES.CO2 ? "CO₂" : "PH₃"}: {status === "inactive" ? "INACTIVE" : status.toUpperCase()}
//                         </Text>
//                         <Text
//                           type="secondary"
//                           style={{ fontSize: "10px", color: "black" }}
//                         >
//                           {status === "inactive" ? "Offline" : `${device.deviceTypeId === DEVICE_TYPES.CO2 ? device.value : device.value.toFixed(2)} ppm`}
//                         </Text>
//                         {/* IP Address moved to bottom */}
//                         <Text
//                           style={{
//                             fontSize: "11px",
//                             fontFamily: "monospace",
//                             color: "#666",
//                           }}
//                         >
//                           IP: {device.ipAddress || "N/A"}
//                         </Text>
//                       </Space>
//                     </div>
//                   </div>
//                   {index < location.devices.length - 1 && (
//                     <Divider
//                       type="vertical"
//                       style={{ height: "80px", margin: "0 4px" }}
//                     />
//                   )}
//                 </React.Fragment>
//               );
//             })}
//           </div>
//         </Card>
//       </Col>
//     );
//   };

//   // Main render function for location card
//   const renderLocationCard = (location) => {
//     if (location.hasMultipleDevices && location.totalDevices > 2) {
//       return renderMultiDeviceLocationCard(location);
//     } else {
//       return renderStandardLocationCard(location);
//     }
//   };

//   if (loading && processedLocations.length === 0) {
//     return (
//       <div style={{ 
//         display: "flex", 
//         justifyContent: "center", 
//         alignItems: "center", 
//         minHeight: "100vh" 
//       }}>
//         <Spin size="large" tip="Loading dashboard data..." />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div style={{ padding: "20px" }}>
//         <Alert
//           message="Error"
//           description={error}
//           type="error"
//           showIcon
//           action={
//             <Button size="small" onClick={fetchData}>
//               Retry
//             </Button>
//           }
//         />
//       </div>
//     );
//   }

//   return (
//     <div
//       style={{
//         padding: "16px",
//         backgroundColor: "#f5f7fa",
//         minHeight: "100vh",
//       }}
//     >
//       {/* Header Section */}
//       <div style={{ marginBottom: 16 }}>
//         <Row gutter={[16, 16]} align="middle" justify="space-between">
//           <Col>
//             <Title
//               level={3}
//               style={{ margin: 0, display: "flex", alignItems: "center" }}
//             >
//               <PieChartOutlined style={{ marginRight: 8, color: "#1890ff" }} />
//               Display Dashboard
//             </Title>
//             <Text type="secondary" style={{ fontSize: "12px" }}>
//               Real-time monitoring of CO₂ and Phosphine levels across all godowns
//             </Text>
//           </Col>
//           <Col>
//             <Space wrap>
//               {/* Search Bar */}
//               <Input
//                 placeholder="Search location, IP, value..."
//                 prefix={<SearchOutlined />}
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 style={{ width: 200 }}
//                 size="small"
//                 allowClear
//                 suffix={
//                   searchTerm && (
//                     <ClearOutlined
//                       onClick={handleClearSearch}
//                       style={{ cursor: "pointer", color: "#999" }}
//                     />
//                   )
//                 }
//               />
              
//               {/* Search Results Count Badge */}
//               {searchTerm && (
//                 <Badge
//                   count={filteredLocations.length}
//                   style={{ 
//                     backgroundColor: filteredLocations.length > 0 ? '#1890ff' : '#f5222d',
//                     marginRight: 8 
//                   }}
//                 />
//               )}
              
//               <Button
//                 type="primary"
//                 icon={<ReloadOutlined />}
//                 onClick={handleRefresh}
//                 size="small"
//                 loading={loading}
//               >
//                 Refresh
//               </Button>
//             </Space>
//           </Col>
//         </Row>

//         {/* Search Status Info */}
//         {searchTerm && (
//           <Alert
//             message={
//               <span>
//                 Showing <strong>{filteredLocations.length}</strong> of{" "}
//                 <strong>{processedLocations.length}</strong> locations matching "
//                 <strong>{searchTerm}</strong>"
//                 {filteredLocations.length === 0 && (
//                   <span> - No matching results found</span>
//                 )}
//               </span>
//             }
//             type={filteredLocations.length > 0 ? "info" : "warning"}
//             showIcon
//             style={{ marginTop: 12, fontSize: "12px" }}
//             action={
//               searchTerm && (
//                 <Button size="small" type="link" onClick={handleClearSearch}>
//                   Clear Search
//                 </Button>
//               )
//             }
//           />
//         )}

//         {/* Site Information */}
//         <Card
//           size="small"
//           style={{
//             marginTop: 12,
//             backgroundColor: "#e6f7ff",
//             borderColor: "#91d5ff",
//           }}
//         >
//           <Row align="middle" justify="space-between">
//             <Col>
//               <Space>
//                 <EnvironmentOutlined
//                   style={{ fontSize: 16, color: "#1890ff" }}
//                 />
//                 <div>
//                   <Title level={5} style={{ margin: 0 }}>
//                     {selectedSite}
//                   </Title>
//                   <Text type="secondary" style={{ fontSize: "11px" }}>
//                     {filteredLocations.length} Godowns •{" "}
//                     {searchTerm
//                       ? `Filtered from ${processedLocations.length} total`
//                       : `Total ${processedLocations.length}`}{" "}
//                     • Last Updated: {new Date().toLocaleTimeString()}
//                   </Text>
//                 </div>
//               </Space>
//             </Col>
//           </Row>
//         </Card>
//       </div>

//       {/* Legend Section */}
//       <Card size="small" style={{ marginBottom: 16, fontSize: "11px" }}>
//         <Row gutter={[8, 8]} justify="center">
//           <Col xs={24} md={6}>
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//               }}
//             >
//               <div
//                 style={{
//                   width: 12,
//                   height: 12,
//                   borderRadius: "50%",
//                   backgroundColor: STATUS_COLORS.normal,
//                   marginRight: 6,
//                 }}
//               />
//               <Text>
//                 Normal (CO₂ {getThresholdText(DEVICE_TYPES.CO2, 'normal')}, PH₃{" "}
//                 {getThresholdText(DEVICE_TYPES.PH3, 'normal')})
//               </Text>
//             </div>
//           </Col>
//           <Col xs={24} md={6}>
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//               }}
//             >
//               <div
//                 style={{
//                   width: 12,
//                   height: 12,
//                   borderRadius: "50%",
//                   backgroundColor: STATUS_COLORS.severe,
//                   marginRight: 6,
//                 }}
//               />
//               <Text>
//                 Severe (CO₂ {getThresholdText(DEVICE_TYPES.CO2, 'severe')}, PH₃{" "}
//                 {getThresholdText(DEVICE_TYPES.PH3, 'severe')})
//               </Text>
//             </div>
//           </Col>
//           <Col xs={24} md={6}>
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//               }}
//             >
//               <div
//                 style={{
//                   width: 12,
//                   height: 12,
//                   borderRadius: "50%",
//                   backgroundColor: STATUS_COLORS.critical,
//                   marginRight: 6,
//                 }}
//               />
//               <Text>
//                 Critical (CO₂ {getThresholdText(DEVICE_TYPES.CO2, 'critical')}, PH₃{" "}
//                 {getThresholdText(DEVICE_TYPES.PH3, 'critical')})
//               </Text>
//             </div>
//           </Col>
//           <Col xs={24} md={6}>
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//               }}
//             >
//               <div
//                 style={{
//                   width: 12,
//                   height: 12,
//                   borderRadius: "50%",
//                   backgroundColor: STATUS_COLORS.inactive,
//                   marginRight: 6,
//                 }}
//               />
//               <Text>
//                 Inactive (Device Offline)
//               </Text>
//             </div>
//           </Col>
//         </Row>
//       </Card>

//       {/* Godown Cards Grid */}
//       {filteredLocations.length > 0 ? (
//         <Row gutter={[16, 16]}>
//           {filteredLocations.map((location) => renderLocationCard(location))}
//         </Row>
//       ) : (
//         <Alert
//           message={searchTerm ? "No Matching Results" : "No Data Available"}
//           description={
//             searchTerm
//               ? `No godowns found matching "${searchTerm}". Try a different search term or clear the search.`
//               : "There are no godowns with device data to display."
//           }
//           type={searchTerm ? "warning" : "info"}
//           showIcon
//           style={{ margin: "20px 0" }}
//           action={
//             searchTerm && (
//               <Button size="small" onClick={handleClearSearch}>
//                 Clear Search
//               </Button>
//             )
//           }
//         />
//       )}

//       <div
//         style={{
//           marginTop: 16,
//           textAlign: "center",
//           padding: "12px 0",
//           borderTop: "1px solid #f0f0f0",
//           fontSize: "12px",
//           color: "#666",
//         }}
//       >
//         <Text type="secondary">
//           Display Dashboard • {selectedSite} •{" "}
//           {searchTerm
//             ? `Showing ${filteredLocations.length} filtered locations • `
//             : ""}
//           Auto-refresh every 30 seconds • Last Updated:{" "}
//           {new Date().toLocaleTimeString()} • Total Devices:{" "}
//           {filteredLocations.reduce((total, loc) => {
//             return total + (loc.devices ? loc.devices.length : 0);
//           }, 0)}
//         </Text>
//       </div>

//       <div className="fixed bottom-2 left-4 text-xs font-bold z-50 pointer-events-none">
//       </div>
//     </div>
//   );
// };

// export default DisplayDashboard;

//-----------------------------below code is heart-beat of card when severe and critical count increase--------

// import React, { useState, useEffect } from "react";
// import {
//   Row,
//   Col,
//   Card,
//   Typography,
//   Space,
//   Divider,
//   Select,
//   Tooltip,
//   Button,
//   Badge,
//   Tag,
//   Statistic,
//   Spin,
//   Alert,
//   Input,
// } from "antd";
// import {
//   PieChartOutlined,
//   EnvironmentOutlined,
//   ReloadOutlined,
//   InfoCircleOutlined,
//   WarningOutlined,
//   SafetyOutlined,
//   WifiOutlined,
//   CloudOutlined,
//   ExclamationCircleOutlined,
//   SearchOutlined,
//   ClearOutlined,
//   CalendarOutlined,
//   ClockCircleOutlined,
// } from "@ant-design/icons";
// import { CO2API, gasFetch } from "../../../config";

// const { Title, Text } = Typography;
// const { Option } = Select;
// const { Search } = Input;

// // Color scheme for different status levels
// const STATUS_COLORS = {
//   normal: "#52c41a", // Green
//   severe: "#faad14", // Orange
//   critical: "#f5222d", // Red
//   inactive: "#8c8c8c", // Gray for inactive
//   default: "#d9d9d9", // Gray
//   zeroCount: "#d9d9d9", // Gray for zero counts
// };

// // DateTime background colors based on card status
// const DATETIME_BG_COLORS = {
//   normal: {
//     light: "#d9f7be", // Light green
//     dark: "#52c41a", // Dark green for text/icons
//     border: "#b7eb8f",
//   },
//   severe: {
//     light: "#fff1b8", // Light orange
//     dark: "#fa8c16", // Dark orange for text/icons
//     border: "#ffd666",
//   },
//   critical: {
//     light: "#ffccc7", // Light red
//     dark: "#ff4d4f", // Dark red for text/icons
//     border: "#ffa39e",
//   },
//   inactive: {
//     light: "#f5f5f5", // Light gray
//     dark: "#8c8c8c", // Dark gray for text/icons
//     border: "#d9d9d9",
//   },
//   default: {
//     light: "#e6f7ff", // Light blue
//     dark: "#1890ff", // Blue for text/icons
//     border: "#91d5ff",
//   },
// };

// // Device type constants
// const DEVICE_TYPES = {
//   CO2: 30000,
//   PH3: 30001,
// };

// // Static thresholds (will be replaced by API data)
// const DEFAULT_THRESHOLDS = {
//   [DEVICE_TYPES.CO2]: {
//     normal: { min: 0, max: 600 },
//     severe: { min: 600, max: 1500 },
//     critical: { min: 1500, max: 5500 },
//   },
//   [DEVICE_TYPES.PH3]: {
//     normal: { min: 0, max: 3 },
//     severe: { min: 3, max: 7.5 },
//     critical: { min: 7.5, max: 25 },
//   },
// };

// // Determine status based on value and thresholds
// const getStatus = (value, thresholds, deviceTypeId) => {
//   // Handle inactive devices (null values)
//   if (value === null || value === undefined) {
//     return "inactive";
//   }
  
//   if (!thresholds[deviceTypeId]) {
//     // Fallback to default thresholds if API data not loaded
//     const defaultThresholds = DEFAULT_THRESHOLDS[deviceTypeId];
//     if (value <= defaultThresholds.normal.max) return "normal";
//     if (value <= defaultThresholds.severe.max) return "severe";
//     return "critical";
//   }

//   if (value <= thresholds[deviceTypeId].normal.max) return "normal";
//   if (value <= thresholds[deviceTypeId].severe.max) return "severe";
//   return "critical";
// };

// // Get overall location status based on both CO2 and Phosphine
// const getOverallLocationStatus = (locationData, thresholds) => {
//   if (!locationData || locationData.length === 0) return "default";

//   let co2Status = "default";
//   let ph3Status = "default";

//   locationData.forEach((device) => {
//     const status = getStatus(device.value, thresholds, device.deviceTypeId);
//     if (device.deviceTypeId === DEVICE_TYPES.CO2) {
//       co2Status = status;
//     } else if (device.deviceTypeId === DEVICE_TYPES.PH3) {
//       ph3Status = status;
//     }
//   });

//   // Return the worst status
//   if (co2Status === "critical" || ph3Status === "critical") return "critical";
//   if (co2Status === "severe" || ph3Status === "severe") return "severe";
//   if (co2Status === "normal" || ph3Status === "normal") return "normal";
//   if (co2Status === "inactive" || ph3Status === "inactive") return "inactive";
//   return "default";
// };

// // Get status color
// const getStatusColor = (status) =>
//   STATUS_COLORS[status] || STATUS_COLORS.default;

// // Get status icon
// const getStatusIcon = (status) => {
//   switch (status) {
//     case "normal":
//       return (
//         <SafetyOutlined
//           style={{ color: STATUS_COLORS.normal, fontSize: "14px" }}
//         />
//       );
//     case "severe":
//       return (
//         <WarningOutlined
//           style={{ color: STATUS_COLORS.severe, fontSize: "14px" }}
//         />
//       );
//     case "critical":
//       return (
//         <WarningOutlined
//           style={{ color: STATUS_COLORS.critical, fontSize: "14px" }}
//         />
//       );
//     case "inactive":
//       return (
//         <ExclamationCircleOutlined
//           style={{ color: STATUS_COLORS.inactive, fontSize: "14px" }}
//         />
//       );
//     default:
//       return null;
//   }
// };

// // Get the latest dateTime from devices in a location
// const getLatestDateTime = (devices) => {
//   if (!devices || devices.length === 0) return null;
  
//   // Filter out null dateTimes
//   const validDateTimes = devices
//     .map(device => device.dateTime)
//     .filter(dateTime => dateTime !== null);
    
//   if (validDateTimes.length === 0) return null;
  
//   // Find the latest dateTime
//   const latest = validDateTimes.reduce((latest, current) => {
//     return new Date(current) > new Date(latest) ? current : latest;
//   }, validDateTimes[0]);
  
//   return latest;
// };

// // Format date time for display
// const formatDateTime = (dateTimeString) => {
//   if (!dateTimeString) return null;
  
//   try {
//     const date = new Date(dateTimeString);
//     return {
//       date: date.toLocaleDateString('en-GB', { 
//         day: '2-digit', 
//         month: 'short', 
//         year: 'numeric' 
//       }),
//       time: date.toLocaleTimeString('en-GB', { 
//         hour: '2-digit', 
//         minute: '2-digit',
//         hour12: false 
//       }),
//       full: date.toLocaleString('en-GB', {
//         day: '2-digit',
//         month: 'short',
//         year: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit',
//         hour12: false
//       })
//     };
//   } catch (error) {
//     console.error('Error formatting date:', error);
//     return null;
//   }
// };

// // Radial Gauge Component
// const RadialGauge = ({ value, thresholds, deviceTypeId, maxValue = null }) => {
//   const status = getStatus(value, thresholds, deviceTypeId);
  
//   // Handle inactive devices
//   if (status === "inactive") {
//     return (
//       <div
//         style={{
//           position: "relative",
//           width: "80px",
//           height: "80px",
//           margin: "0 auto",
//         }}
//       >
//         <div
//           style={{
//             position: "absolute",
//             width: "80px",
//             height: "80px",
//             borderRadius: "50%",
//             background: STATUS_COLORS.inactive,
//             opacity: 0.3,
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//           }}
//         >
//           <ExclamationCircleOutlined 
//             style={{ 
//               fontSize: "24px", 
//               color: STATUS_COLORS.inactive 
//             }} 
//           />
//         </div>
//         <div
//           style={{
//             position: "absolute",
//             width: "60px",
//             height: "60px",
//             borderRadius: "50%",
//             background: "white",
//             top: "10px",
//             left: "10px",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
//           }}
//         >
//           <div style={{ textAlign: "center" }}>
//             <div
//               style={{
//                 fontSize: "14px",
//                 fontWeight: "bold",
//                 color: STATUS_COLORS.inactive,
//               }}
//             >
//               Offline
//             </div>
//             <div style={{ fontSize: "10px", color: "#666" }}>Device</div>
//           </div>
//         </div>
//       </div>
//     );
//   }
  
//   // Determine max value for percentage calculation
//   let maxValueForGauge = maxValue;
//   if (!maxValueForGauge && thresholds[deviceTypeId]) {
//     maxValueForGauge = thresholds[deviceTypeId].critical.max;
//   } else if (!maxValueForGauge) {
//     maxValueForGauge = deviceTypeId === DEVICE_TYPES.CO2 ? 5500 : 25;
//   }
  
//   const percentage = Math.min(100, (value / maxValueForGauge) * 100);

//   return (
//     <div
//       style={{
//         position: "relative",
//         width: "80px",
//         height: "80px",
//         margin: "0 auto",
//       }}
//     >
//       {/* Outer ring */}
//       <div
//         style={{
//           position: "absolute",
//           width: "80px",
//           height: "80px",
//           borderRadius: "50%",
//           background: `conic-gradient(${getStatusColor(
//             status
//           )} 0% ${percentage}%, #f5f5f5 ${percentage}% 100%)`,
//           boxShadow: `0 0 8px ${getStatusColor(status)}40`,
//         }}
//       />

//       {/* Inner circle */}
//       <div
//         style={{
//           position: "absolute",
//           width: "60px",
//           height: "60px",
//           borderRadius: "50%",
//           background: "white",
//           top: "10px",
//           left: "10px",
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "center",
//           boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
//         }}
//       >
//         <div style={{ textAlign: "center" }}>
//           <div
//             style={{
//               fontSize: deviceTypeId === DEVICE_TYPES.CO2 ? "16px" : "14px",
//               fontWeight: "bold",
//               color: getStatusColor(status),
//             }}
//           >
//             {deviceTypeId === DEVICE_TYPES.CO2 ? value : value.toFixed(2)}
//           </div>
//           <div style={{ fontSize: "10px", color: "#666" }}>ppm</div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // DateTime Display Component
// const DateTimeDisplay = ({ dateTime, status = "default" }) => {
//   const formattedDateTime = formatDateTime(dateTime);
//   const colorTheme = DATETIME_BG_COLORS[status] || DATETIME_BG_COLORS.default;

//   return (
//     <Tooltip title={`Last Updated: ${formattedDateTime ? formattedDateTime.full : "No data"}`}>
//       <div
//         style={{
//           backgroundColor: colorTheme.light,
//           borderRadius: "6px",
//           padding: "2px 6px",
//           border: `1px solid ${colorTheme.border}`,
//           display: "inline-flex",
//           alignItems: "center",
//           gap: "4px",
//           cursor: "pointer",
//           transition: "all 0.2s ease",
//           minWidth: "110px",
//           justifyContent: "center",
//           height: "28px",
//           boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
//         }}
//         onMouseEnter={(e) => {
//           e.currentTarget.style.transform = "translateY(-1px)";
//           e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
//         }}
//         onMouseLeave={(e) => {
//           e.currentTarget.style.transform = "translateY(0)";
//           e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)";
//         }}
//       >
//         {formattedDateTime ? (
//           <Space size={2} align="center">
//             <CalendarOutlined style={{ 
//               fontSize: "10px", 
//               color: colorTheme.dark,
//               fontWeight: "bold" 
//             }} />
//             <Text style={{ 
//               fontSize: "11px", 
//               color: colorTheme.dark,
//               fontWeight: "bold" 
//             }}>
//               {formattedDateTime.date}
//             </Text>
//             <Text style={{ 
//               fontSize: "11px", 
//               color: colorTheme.dark,
//               fontWeight: "bold" 
//             }}>
//               {formattedDateTime.time}
//             </Text>
//           </Space>
//         ) : (
//           <Space size={2} align="center">
//             <ExclamationCircleOutlined style={{ 
//               fontSize: "10px", 
//               color: colorTheme.dark 
//             }} />
//             <Text style={{ 
//               fontSize: "11px", 
//               color: colorTheme.dark,
//               fontWeight: "bold" 
//             }}>
//               No Data
//             </Text>
//           </Space>
//         )}
//       </div>
//     </Tooltip>
//   );
// };

// // DisplayDashboard Component
// const DisplayDashboard = () => {
//   const [selectedSite, setSelectedSite] = useState("Sonipat (Haryana)");
//   const [refreshCounter, setRefreshCounter] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [thresholds, setThresholds] = useState({});
//   const [locationData, setLocationData] = useState({});
//   const [processedLocations, setProcessedLocations] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredLocations, setFilteredLocations] = useState([]);

//   // CSS for heartbeat animation
//   const heartbeatAnimation = `
//     @keyframes heartbeat {
//       0% {
//         transform: scale(1);
//         box-shadow: 0 2px 8px rgba(0,0,0,0.08);
//       }
//       25% {
//         transform: scale(1.02);
//         box-shadow: 0 4px 12px rgba(0,0,0,0.12);
//       }
//       50% {
//         transform: scale(1.01);
//         box-shadow: 0 3px 10px rgba(0,0,0,0.1);
//       }
//       75% {
//         transform: scale(1.02);
//         box-shadow: 0 4px 12px rgba(0,0,0,0.12);
//       }
//       100% {
//         transform: scale(1);
//         box-shadow: 0 2px 8px rgba(0,0,0,0.08);
//       }
//     }
//   `;

//   // Process thresholds data from API
//   const processThresholdsData = (apiData) => {
//     const processed = {};
    
//     apiData.forEach((item) => {
//       if (!processed[item.deviceTypeId]) {
//         processed[item.deviceTypeId] = {};
//       }
      
//       switch (item.alertType.toLowerCase()) {
//         case 'normal':
//           processed[item.deviceTypeId].normal = {
//             min: item.minValue,
//             max: item.maxValue,
//           };
//           break;
//         case 'severe':
//           processed[item.deviceTypeId].severe = {
//             min: item.minValue,
//             max: item.maxValue,
//           };
//           break;
//         case 'critical':
//           processed[item.deviceTypeId].critical = {
//             min: item.minValue,
//             max: item.maxValue,
//           };
//           break;
//         default:
//           break;
//       }
//     });
    
//     return processed;
//   };

//   // Process location data from API
//   const processLocationData = (apiData) => {
//     const processed = [];
    
//     Object.entries(apiData).forEach(([locationName, devices]) => {
//       // Group devices by type
//       const co2Devices = devices.filter(d => d.deviceTypeId === DEVICE_TYPES.CO2);
//       const ph3Devices = devices.filter(d => d.deviceTypeId === DEVICE_TYPES.PH3);
      
//       // Calculate total severe and critical counts for the location
//       const totalSevereCount = devices.reduce((sum, device) => sum + (device.severeCount || 0), 0);
//       const totalCriticalCount = devices.reduce((sum, device) => sum + (device.criticalCount || 0), 0);
//       const hasAlerts = totalSevereCount > 0 || totalCriticalCount > 0;
      
//       const location = {
//         id: locationName,
//         name: locationName,
//         devices: devices, // Store raw device data
//         co2Devices: co2Devices,
//         ph3Devices: ph3Devices,
//         hasMultipleCO2: co2Devices.length > 1,
//         hasMultiplePH3: ph3Devices.length > 1,
//         hasMultipleDevices: co2Devices.length > 1 || ph3Devices.length > 1,
//         totalDevices: devices.length,
//         totalSevereCount,
//         totalCriticalCount,
//         hasAlerts,
//       };
      
//       processed.push(location);
//     });
    
//     // Sort locations: 2-device cards first, 4-device cards last
//     return processed.sort((a, b) => {
//       // If both have multiple devices or both don't, maintain original order
//       if (a.hasMultipleDevices === b.hasMultipleDevices) return 0;
//       // Put 2-device cards (no multiple devices) first
//       if (!a.hasMultipleDevices && b.hasMultipleDevices) return -1;
//       // Put 4-device cards (multiple devices) last
//       return 1;
//     });
//   };

//   // Fetch data from APIs
//   const fetchData = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       // Fetch thresholds
//       const thresholdsResponse = await fetch(
//         `${CO2API}/api/device-ranges`
//       );
//       const thresholdsData = await thresholdsResponse.json();
//       const processedThresholds = processThresholdsData(thresholdsData);
//       setThresholds(processedThresholds);

//       // Fetch location alerts
//       const alertsResponse = await fetch(
//         `${CO2API}/api/device-logs/alerts`
//       );
//       const alertsData = await alertsResponse.json();
//       const processedLocations = processLocationData(alertsData);
//       setLocationData(alertsData);
//       setProcessedLocations(processedLocations);
//       setFilteredLocations(processedLocations); // Initialize filtered locations
      
//     } catch (err) {
//       setError("Failed to fetch data. Please try again.");
//       console.error("Error fetching data:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Initial data fetch
//   useEffect(() => {
//     fetchData();
//   }, []);

//   // Filter locations based on search term
//   useEffect(() => {
//     if (!searchTerm.trim()) {
//       setFilteredLocations(processedLocations);
//       return;
//     }

//     const searchLower = searchTerm.toLowerCase();
//     const filtered = processedLocations.filter(location => {
//       // Search in location name
//       if (location.name.toLowerCase().includes(searchLower)) return true;
      
//       // Search in all device IP addresses
//       const allIPs = location.devices.map(d => d.ipAddress).filter(ip => ip);
//       if (allIPs.some(ip => ip.toLowerCase().includes(searchLower))) return true;
      
//       // Search in all device values
//       const allValues = location.devices.map(d => d.value ? d.value.toString() : "inactive");
//       if (allValues.some(val => val.includes(searchLower))) return true;
      
//       // Search in status
//       const overallStatus = getOverallLocationStatus(location.devices, thresholds);
//       if (overallStatus.toLowerCase().includes(searchLower)) return true;
      
//       // Search in individual device statuses
//       const allStatuses = location.devices.map(device => 
//         getStatus(device.value, thresholds, device.deviceTypeId)
//       );
//       if (allStatuses.some(status => status.toLowerCase().includes(searchLower))) return true;
      
//       return false;
//     });
    
//     setFilteredLocations(filtered);
//   }, [searchTerm, processedLocations, thresholds]);

//   // Handle search
//   const handleSearch = (value) => {
//     setSearchTerm(value);
//   };

//   // Clear search
//   const handleClearSearch = () => {
//     setSearchTerm("");
//   };

//   // Handle refresh
//   const handleRefresh = () => {
//     setSearchTerm(""); // Clear search on refresh
//     setRefreshCounter((prev) => prev + 1);
//     fetchData();
//   };

//   // Calculate summary statistics based on filtered locations
//   const calculateSummary = () => {
//     const totalGodowns = filteredLocations.length;
    
//     // Calculate averages across all devices
//     let totalCO2 = 0;
//     let totalPH3 = 0;
//     let co2Count = 0;
//     let ph3Count = 0;

//     filteredLocations.forEach((location) => {
//       location.co2Devices.forEach(device => {
//         if (device.value !== null && device.value !== undefined) {
//           totalCO2 += device.value;
//           co2Count++;
//         }
//       });
//       location.ph3Devices.forEach(device => {
//         if (device.value !== null && device.value !== undefined) {
//           totalPH3 += device.value;
//           ph3Count++;
//         }
//       });
//     });

//     const avgCO2 = co2Count > 0 ? Math.round(totalCO2 / co2Count) : 0;
//     const avgPhosphine = ph3Count > 0 ? totalPH3 / ph3Count : 0;

//     // Count statuses based on overall location status
//     let normalCount = 0;
//     let severeCount = 0;
//     let criticalCount = 0;
//     let inactiveCount = 0;

//     filteredLocations.forEach((location) => {
//       const overallStatus = getOverallLocationStatus(location.devices, thresholds);
//       if (overallStatus === "normal") normalCount++;
//       else if (overallStatus === "severe") severeCount++;
//       else if (overallStatus === "critical") criticalCount++;
//       else if (overallStatus === "inactive") inactiveCount++;
//     });

//     return {
//       totalGodowns,
//       avgCO2,
//       avgPhosphine,
//       normalCount,
//       severeCount,
//       criticalCount,
//       inactiveCount,
//     };
//   };

//   const summary = calculateSummary();

//   // Get threshold text for legend
//   const getThresholdText = (deviceTypeId, statusType) => {
//     if (!thresholds[deviceTypeId] || !thresholds[deviceTypeId][statusType]) {
//       const defaultThresholds = DEFAULT_THRESHOLDS[deviceTypeId];
//       return statusType === 'normal' 
//         ? `≤ ${defaultThresholds.normal.max} ppm`
//         : statusType === 'severe'
//         ? `≤ ${defaultThresholds.severe.max} ppm`
//         : `≤ ${defaultThresholds.critical.max} ppm`;
//     }
    
//     return `≤ ${thresholds[deviceTypeId][statusType].max} ppm`;
//   };

//   // Render a standard location card (for 2 devices)
//   const renderStandardLocationCard = (location) => {
//     const overallStatus = getOverallLocationStatus(location.devices, thresholds);
//     const latestDateTime = getLatestDateTime(location.devices);
    
//     // Get the first CO2 and PH3 devices
//     const co2Device = location.co2Devices[0];
//     const ph3Device = location.ph3Devices[0];
    
//     const co2Status = co2Device ? getStatus(co2Device.value, thresholds, DEVICE_TYPES.CO2) : "inactive";
//     const phosphineStatus = ph3Device ? getStatus(ph3Device.value, thresholds, DEVICE_TYPES.PH3) : "inactive";

//     // Check if card should have heartbeat animation
//     const shouldHeartbeat = location.hasAlerts;
    
//     // Card border color - use red if there are critical counts
//     const borderColor = location.totalCriticalCount > 0 
//       ? STATUS_COLORS.critical 
//       : location.totalSevereCount > 0 
//         ? STATUS_COLORS.severe 
//         : getStatusColor(overallStatus);

//     return (
//       <Col xs={24} sm={12} md={8} lg={6} key={location.id}>
//         <style>{heartbeatAnimation}</style>
//         <Card
//           style={{
//             height: "330px",
//             border: `2px solid ${borderColor}`,
//             borderRadius: "10px",
//             boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
//             overflow: "hidden",
//             transition: "all 0.3s ease",
//             animation: shouldHeartbeat ? "heartbeat 1.5s ease-in-out infinite" : "none",
//             position: "relative",
//           }}
//           bodyStyle={{
//             padding: "12px",
//             height: "100%",
//             display: "flex",
//             flexDirection: "column",
//           }}
//           hoverable
//         >
//           {/* Card Header */}
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "flex-start",
//               marginBottom: "8px",
//             }}
//           >
//             <div>
//               <Text strong style={{ fontSize: "16px", display: "block" }}>
//                 {"Location"}-{location.name}
//               </Text>
//             </div>
//             {/* DateTime display */}
//             <div style={{ textAlign: "right" }}>
//               <DateTimeDisplay
//                 dateTime={latestDateTime} 
//                 status={overallStatus} 
//               />
//             </div>
//           </div>

//           {/* Device Information - Two columns showing severe and critical counts */}
//           <Row gutter={[8, 8]} style={{ marginBottom: "16px" }}>
//             {/* CO2 Device Information */}
//             <Col span={12}>
//               <div
//                 style={{
//                   padding: "6px 8px",
//                   backgroundColor: co2Status === "inactive" ? "#f5f5f5" : "#e6f7ff",
//                   borderRadius: "4px",
//                   border: `1px solid ${getStatusColor(co2Status)}30`,
//                 }}
//               >
//                 <Space direction="vertical" size={2} style={{ width: "100%" }}>
//                   <Space size={4}>
//                     <CloudOutlined
//                       style={{ 
//                         fontSize: "12px", 
//                         color: co2Status === "inactive" ? STATUS_COLORS.inactive : "#1890ff" 
//                       }}
//                     />
//                     <Text strong style={{ fontSize: "11px", color: co2Status === "inactive" ? "#666" : "#000" }}>
//                       CO₂ Device
//                     </Text>
//                   </Space>
//                   {/* Severe and Critical Counts */}
//                   <Row gutter={[4, 2]} style={{ marginTop: 2 }}>
//                     <Col span={12}>
//                       <div style={{ textAlign: "center" }}>
//                         <Text strong style={{ 
//                           fontSize: "14px", 
//                           color: co2Device?.severeCount > 0 ? "#faad14" : STATUS_COLORS.zeroCount 
//                         }}>
//                           Severe
//                         </Text>
//                         <div style={{ 
//                           fontSize: "14px", 
//                           fontWeight: "bold", 
//                           color: co2Device?.severeCount > 0 ? "#faad14" : STATUS_COLORS.zeroCount 
//                         }}>
//                           {co2Device?.severeCount || 0}
//                         </div>
//                       </div>
//                     </Col>
//                     <Col span={12}>
//                       <div style={{ textAlign: "center" }}>
//                         <Text strong style={{ 
//                           fontSize: "14px", 
//                           color: co2Device?.criticalCount > 0 ? "#f5222d" : STATUS_COLORS.zeroCount 
//                         }}>
//                           Critical
//                         </Text>
//                         <div style={{ 
//                           fontSize: "14px", 
//                           fontWeight: "bold", 
//                           color: co2Device?.criticalCount > 0 ? "#f5222d" : STATUS_COLORS.zeroCount 
//                         }}>
//                           {co2Device?.criticalCount || 0}
//                         </div>
//                       </div>
//                     </Col>
//                   </Row>
//                 </Space>
//               </div>
//             </Col>

//             {/* Phosphine Device Information */}
//             <Col span={12}>
//               <div
//                 style={{
//                   padding: "6px 8px",
//                   backgroundColor: phosphineStatus === "inactive" ? "#f5f5f5" : "#f6ffed",
//                   borderRadius: "4px",
//                   border: `1px solid ${getStatusColor(phosphineStatus)}30`,
//                 }}
//               >
//                 <Space direction="vertical" size={2} style={{ width: "100%" }}>
//                   <Space size={4}>
//                     <CloudOutlined
//                       style={{ 
//                         fontSize: "12px", 
//                         color: phosphineStatus === "inactive" ? STATUS_COLORS.inactive : "#52c41a" 
//                       }}
//                     />
//                     <Text strong style={{ fontSize: "11px", color: phosphineStatus === "inactive" ? "#666" : "#000" }}>
//                       PH₃ Device
//                     </Text>
//                   </Space>
//                   {/* Severe and Critical Counts */}
//                   <Row gutter={[4, 2]} style={{ marginTop: 2 }}>
//                     <Col span={12}>
//                       <div style={{ textAlign: "center" }}>
//                         <Text strong style={{ 
//                           fontSize: "14px", 
//                           color: ph3Device?.severeCount > 0 ? "#faad14" : STATUS_COLORS.zeroCount 
//                         }}>
//                           Severe
//                         </Text>
//                         <div style={{ 
//                           fontSize: "14px", 
//                           fontWeight: "bold", 
//                           color: ph3Device?.severeCount > 0 ? "#faad14" : STATUS_COLORS.zeroCount 
//                         }}>
//                           {ph3Device?.severeCount || 0}
//                         </div>
//                       </div>
//                     </Col>
//                     <Col span={12}>
//                       <div style={{ textAlign: "center" }}>
//                         <Text strong style={{ 
//                           fontSize: "14px", 
//                           color: ph3Device?.criticalCount > 0 ? "#f5222d" : STATUS_COLORS.zeroCount 
//                         }}>
//                           Critical
//                         </Text>
//                         <div style={{ 
//                           fontSize: "14px", 
//                           fontWeight: "bold", 
//                           color: ph3Device?.criticalCount > 0 ? "#f5222d" : STATUS_COLORS.zeroCount 
//                         }}>
//                           {ph3Device?.criticalCount || 0}
//                         </div>
//                       </div>
//                     </Col>
//                   </Row>
//                 </Space>
//               </div>
//             </Col>
//           </Row>

//           {/* Gauge Display - Two gauges side by side */}
//           <div
//             style={{
//               flex: 1,
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "center",
//               marginBottom: "12px",
//             }}
//           >
//             {/* CO2 Gauge */}
//             <div style={{ width: "48%", textAlign: "center" }}>
//               {co2Device ? (
//                 <>
//                   <RadialGauge
//                     value={co2Device.value}
//                     thresholds={thresholds}
//                     deviceTypeId={DEVICE_TYPES.CO2}
//                   />
//                   <div
//                     style={{
//                       marginTop: "8px",
//                       padding: "4px 6px",
//                       backgroundColor: co2Status === "inactive" ? "#f5f5f5" : `${getStatusColor(co2Status)}15`,
//                       borderRadius: "4px",
//                       border: `1px solid ${co2Status === "inactive" ? STATUS_COLORS.inactive : getStatusColor(co2Status)}30`,
//                     }}
//                   >
//                     <Space direction="vertical" size={2} align="center">
//                       <Text
//                         strong
//                         style={{
//                           fontSize: "12px",
//                           color: getStatusColor(co2Status),
//                         }}
//                       >
//                         CO₂: {co2Status === "inactive" ? "INACTIVE" : co2Status.toUpperCase()}
//                       </Text>
//                       <Text
//                         type="secondary"
//                         style={{ fontSize: "10px", color: "black" }}
//                       >
//                         {co2Status === "inactive" ? "Offline" : `${co2Device.value} ppm`}
//                       </Text>
//                       {/* IP Address moved to bottom */}
//                       <Text
//                         style={{
//                           fontSize: "11px",
//                           fontFamily: "monospace",
//                           color: "#666",
//                         }}
//                       >
//                         IP: {co2Device.ipAddress || "N/A"}
//                       </Text>
//                     </Space>
//                   </div>
//                 </>
//               ) : (
//                 <div
//                   style={{
//                     height: "80px",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     flexDirection: "column",
//                   }}
//                 >
//                   <ExclamationCircleOutlined style={{ fontSize: "24px", color: STATUS_COLORS.inactive }} />
//                   <Text type="secondary" style={{ fontSize: "12px", marginTop: "8px" }}>
//                     No CO₂ Device
//                   </Text>
//                 </div>
//               )}
//             </div>

//             {/* Divider */}
//             <Divider
//               type="vertical"
//               style={{ height: "80px", margin: "0 4px" }}
//             />

//             {/* Phosphine Gauge */}
//             <div style={{ width: "48%", textAlign: "center" }}>
//               {ph3Device ? (
//                 <>
//                   <RadialGauge
//                     value={ph3Device.value}
//                     thresholds={thresholds}
//                     deviceTypeId={DEVICE_TYPES.PH3}
//                   />
//                   <div
//                     style={{
//                       marginTop: "8px",
//                       padding: "4px 6px",
//                       backgroundColor: phosphineStatus === "inactive" ? "#f5f5f5" : `${getStatusColor(phosphineStatus)}15`,
//                       borderRadius: "4px",
//                       border: `1px solid ${phosphineStatus === "inactive" ? STATUS_COLORS.inactive : getStatusColor(phosphineStatus)}30`,
//                     }}
//                   >
//                     <Space direction="vertical" size={2} align="center">
//                       <Text
//                         strong
//                         style={{
//                           fontSize: "12px",
//                           color: getStatusColor(phosphineStatus),
//                         }}
//                       >
//                         PH₃: {phosphineStatus === "inactive" ? "INACTIVE" : phosphineStatus.toUpperCase()}
//                       </Text>
//                       <Text
//                         type="secondary"
//                         style={{ fontSize: "10px", color: "black" }}
//                       >
//                         {phosphineStatus === "inactive" ? "Offline" : `${ph3Device.value.toFixed(2)} ppm`}
//                       </Text>
//                       {/* IP Address moved to bottom */}
//                       <Text
//                         style={{
//                           fontSize: "11px",
//                           fontFamily: "monospace",
//                           color: "#666",
//                         }}
//                       >
//                         IP: {ph3Device.ipAddress || "N/A"}
//                       </Text>
//                     </Space>
//                   </div>
//                 </>
//               ) : (
//                 <div
//                   style={{
//                     height: "80px",
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     flexDirection: "column",
//                   }}
//                 >
//                   <ExclamationCircleOutlined style={{ fontSize: "24px", color: STATUS_COLORS.inactive }} />
//                   <Text type="secondary" style={{ fontSize: "12px", marginTop: "8px" }}>
//                     No PH₃ Device
//                   </Text>
//                 </div>
//               )}
//             </div>
//           </div>
          
//           {/* Alert Indicator */}
//           {shouldHeartbeat && (
//             <div
//               style={{
//                 position: "absolute",
//                 top: "4px",
//                 right: "4px",
//                 width: "8px",
//                 height: "8px",
//                 borderRadius: "50%",
//                 backgroundColor: location.totalCriticalCount > 0 ? "#f5222d" : "#faad14",
//                 animation: "heartbeat 1.5s ease-in-out infinite",
//               }}
//             />
//           )}  
//         </Card>
//       </Col>
//     );
//   };

//   // Render a location card with multiple devices (like 3B with 4 devices)
//   const renderMultiDeviceLocationCard = (location) => {
//     const overallStatus = getOverallLocationStatus(location.devices, thresholds);
//     const latestDateTime = getLatestDateTime(location.devices);
//     const totalDevices = location.devices.length;
    
//     const cardHeight = "330px";
    
//     // Check if card should have heartbeat animation
//     const shouldHeartbeat = location.hasAlerts;
    
//     // Card border color - use red if there are critical counts
//     const borderColor = location.totalCriticalCount > 0 
//       ? STATUS_COLORS.critical 
//       : location.totalSevereCount > 0 
//         ? STATUS_COLORS.severe 
//         : getStatusColor(overallStatus);

//     return (
//       <Col xs={24} sm={12} md={12} lg={12} key={location.id}>
//         <style>{heartbeatAnimation}</style>
//         <Card
//           style={{
//             height: cardHeight,
//             border: `2px solid ${borderColor}`,
//             borderRadius: "10px",
//             boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
//             overflow: "hidden",
//             transition: "all 0.3s ease",
//             animation: shouldHeartbeat ? "heartbeat 1.5s ease-in-out infinite" : "none",
//             position: "relative",
//           }}
//           bodyStyle={{
//             padding: "12px",
//             height: "100%",
//             display: "flex",
//             flexDirection: "column",
//           }}
//           hoverable
//         >
//           {/* Card Header */}
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "flex-start",
//               marginBottom: "8px",
//             }}
//           >
//             <div>
//               <Text strong style={{ fontSize: "16px", display: "block" }}>
//                 {"Location"}-{location.name}
//               </Text>
//             </div>
//             {/* DateTime display */}
//             <div style={{ textAlign: "right" }}>
//               <DateTimeDisplay 
//                 dateTime={latestDateTime} 
//                 status={overallStatus} 
//               />
//             </div>
//           </div>

//           {/* Device Information - 4 columns for 4 devices */}
//           <div style={{ marginBottom: "16px" }}>
//             <Row gutter={[8, 8]}>
//               {location.devices.map((device, index) => {
//                 const status = getStatus(device.value, thresholds, device.deviceTypeId);
//                 return (
//                   <Col span={6} key={`device-info-${index}`}>
//                     <div
//                       style={{
//                         padding: "6px 8px",
//                         backgroundColor: status === "inactive" ? "#f5f5f5" : 
//                                        (device.deviceTypeId === DEVICE_TYPES.CO2 ? "#e6f7ff" : "#f6ffed"),
//                         borderRadius: "4px",
//                         border: `1px solid ${getStatusColor(status)}30`,
//                         height: "100%",
//                       }}
//                     >
//                       <Space direction="vertical" size={2} style={{ width: "100%" }}>
//                         <Space size={4}>
//                           <CloudOutlined
//                             style={{ 
//                               fontSize: "12px", 
//                               color: status === "inactive" ? STATUS_COLORS.inactive : 
//                                      (device.deviceTypeId === DEVICE_TYPES.CO2 ? "#1890ff" : "#52c41a") 
//                             }}
//                           />
//                           <Text strong style={{ 
//                             fontSize: "10px",
//                             color: status === "inactive" ? "#666" : "#000"
//                           }}>
//                             {device.deviceTypeId === DEVICE_TYPES.CO2 ? "CO₂" : "PH₃"} {location.hasMultipleDevices ? `#${index + 1}` : ""}
//                           </Text>
//                         </Space>
//                         {/* Severe and Critical Counts */}
//                         <Row gutter={[4, 2]} style={{ marginTop: 2 }}>
//                           <Col span={12}>
//                             <div style={{ textAlign: "center" }}>
//                               <Text strong style={{ 
//                                 fontSize: "14px", 
//                                 color: device.severeCount > 0 ? "#faad14" : STATUS_COLORS.zeroCount 
//                               }}>
//                                 Severe
//                               </Text>
//                               <div style={{ 
//                                 fontSize: "14px", 
//                                 fontWeight: "bold", 
//                                 color: device.severeCount > 0 ? "#faad14" : STATUS_COLORS.zeroCount 
//                               }}>
//                                 {device.severeCount || 0}
//                               </div>
//                             </div>
//                           </Col>
//                           <Col span={12}>
//                             <div style={{ textAlign: "center" }}>
//                               <Text strong style={{ 
//                                 fontSize: "14px", 
//                                 color: device.criticalCount > 0 ? "#f5222d" : STATUS_COLORS.zeroCount 
//                               }}>
//                                 Critical
//                               </Text>
//                               <div style={{ 
//                                 fontSize: "14px", 
//                                 fontWeight: "bold", 
//                                 color: device.criticalCount > 0 ? "#f5222d" : STATUS_COLORS.zeroCount 
//                               }}>
//                                 {device.criticalCount || 0}
//                               </div>
//                             </div>
//                           </Col>
//                         </Row>
//                       </Space>
//                     </div>
//                   </Col>
//                 );
//               })}
//             </Row>
//           </div>

//           {/* Gauge Display - All 4 gauges in one row */}
//           <div
//             style={{
//               flex: 1,
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "center",
//             }}
//           >
//             {location.devices.map((device, index) => {
//               const status = getStatus(device.value, thresholds, device.deviceTypeId);
//               return (
//                 <React.Fragment key={`gauge-container-${index}`}>
//                   <div style={{ width: "25%", textAlign: "center" }}>
//                     <RadialGauge
//                       value={device.value}
//                       thresholds={thresholds}
//                       deviceTypeId={device.deviceTypeId}
//                     />
//                     <div
//                       style={{
//                         marginTop: "8px",
//                         padding: "4px 6px",
//                         backgroundColor: status === "inactive" ? "#f5f5f5" : `${getStatusColor(status)}15`,
//                         borderRadius: "4px",
//                         border: `1px solid ${status === "inactive" ? STATUS_COLORS.inactive : getStatusColor(status)}30`,
//                       }}
//                     >
//                       <Space direction="vertical" size={2} align="center">
//                         <Text
//                           strong
//                           style={{
//                             fontSize: "12px",
//                             color: getStatusColor(status),
//                           }}
//                         >
//                           {device.deviceTypeId === DEVICE_TYPES.CO2 ? "CO₂" : "PH₃"}: {status === "inactive" ? "INACTIVE" : status.toUpperCase()}
//                         </Text>
//                         <Text
//                           type="secondary"
//                           style={{ fontSize: "10px", color: "black" }}
//                         >
//                           {status === "inactive" ? "Offline" : `${device.deviceTypeId === DEVICE_TYPES.CO2 ? device.value : device.value.toFixed(2)} ppm`}
//                         </Text>
//                         {/* IP Address moved to bottom */}
//                         <Text
//                           style={{
//                             fontSize: "11px",
//                             fontFamily: "monospace",
//                             color: "#666",
//                           }}
//                         >
//                           IP: {device.ipAddress || "N/A"}
//                         </Text>
//                       </Space>
//                     </div>
//                   </div>
//                   {index < location.devices.length - 1 && (
//                     <Divider
//                       type="vertical"
//                       style={{ height: "80px", margin: "0 4px" }}
//                     />
//                   )}
//                 </React.Fragment>
//               );
//             })}
//           </div>
          
//           {/* Alert Indicator */}
//           {shouldHeartbeat && (
//             <div
//               style={{
//                 position: "absolute",
//                 top: "4px",
//                 right: "4px",
//                 width: "8px",
//                 height: "8px",
//                 borderRadius: "50%",
//                 backgroundColor: location.totalCriticalCount > 0 ? "#f5222d" : "#faad14",
//                 animation: "heartbeat 1.5s ease-in-out infinite",
//               }}
//             />
//           )}
//         </Card>
//       </Col>
//     );
//   };

//   // Main render function for location card
//   const renderLocationCard = (location) => {
//     if (location.hasMultipleDevices && location.totalDevices > 2) {
//       return renderMultiDeviceLocationCard(location);
//     } else {
//       return renderStandardLocationCard(location);
//     }
//   };

//   if (loading && processedLocations.length === 0) {
//     return (
//       <div style={{ 
//         display: "flex", 
//         justifyContent: "center", 
//         alignItems: "center", 
//         minHeight: "100vh" 
//       }}>
//         <Spin size="large" tip="Loading dashboard data..." />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div style={{ padding: "20px" }}>
//         <Alert
//           message="Error"
//           description={error}
//           type="error"
//           showIcon
//           action={
//             <Button size="small" onClick={fetchData}>
//               Retry
//             </Button>
//           }
//         />
//       </div>
//     );
//   }

//   return (
//     <div
//       style={{
//         padding: "16px",
//         backgroundColor: "#f5f7fa",
//         minHeight: "100vh",
//       }}
//     >
//       {/* Header Section */}
//       <div style={{ marginBottom: 16 }}>
//         <Row gutter={[16, 16]} align="middle" justify="space-between">
//           <Col>
//             <Title
//               level={3}
//               style={{ margin: 0, display: "flex", alignItems: "center" }}
//             >
//               <PieChartOutlined style={{ marginRight: 8, color: "#1890ff" }} />
//               Display Dashboard
//             </Title>
//             <Text type="secondary" style={{ fontSize: "12px" }}>
//               Real-time monitoring of CO₂ and Phosphine levels across all godowns
//             </Text>
//           </Col>
//           <Col>
//             <Space wrap>
//               {/* Search Bar */}
//               <Input
//                 placeholder="Search location, IP, value..."
//                 prefix={<SearchOutlined />}
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 style={{ width: 200 }}
//                 size="small"
//                 allowClear
//                 suffix={
//                   searchTerm && (
//                     <ClearOutlined
//                       onClick={handleClearSearch}
//                       style={{ cursor: "pointer", color: "#999" }}
//                     />
//                   )
//                 }
//               />
              
//               {/* Search Results Count Badge */}
//               {searchTerm && (
//                 <Badge
//                   count={filteredLocations.length}
//                   style={{ 
//                     backgroundColor: filteredLocations.length > 0 ? '#1890ff' : '#f5222d',
//                     marginRight: 8 
//                   }}
//                 />
//               )}
              
//               <Button
//                 type="primary"
//                 icon={<ReloadOutlined />}
//                 onClick={handleRefresh}
//                 size="small"
//                 loading={loading}
//               >
//                 Refresh
//               </Button>
//             </Space>
//           </Col>
//         </Row>

//         {/* Search Status Info */}
//         {searchTerm && (
//           <Alert
//             message={
//               <span>
//                 Showing <strong>{filteredLocations.length}</strong> of{" "}
//                 <strong>{processedLocations.length}</strong> locations matching "
//                 <strong>{searchTerm}</strong>"
//                 {filteredLocations.length === 0 && (
//                   <span> - No matching results found</span>
//                 )}
//               </span>
//             }
//             type={filteredLocations.length > 0 ? "info" : "warning"}
//             showIcon
//             style={{ marginTop: 12, fontSize: "12px" }}
//             action={
//               searchTerm && (
//                 <Button size="small" type="link" onClick={handleClearSearch}>
//                   Clear Search
//                 </Button>
//               )
//             }
//           />
//         )}

//         {/* Site Information */}
//         <Card
//           size="small"
//           style={{
//             marginTop: 12,
//             backgroundColor: "#e6f7ff",
//             borderColor: "#91d5ff",
//           }}
//         >
//           <Row align="middle" justify="space-between">
//             <Col>
//               <Space>
//                 <EnvironmentOutlined
//                   style={{ fontSize: 16, color: "#1890ff" }}
//                 />
//                 <div>
//                   <Title level={5} style={{ margin: 0 }}>
//                     {selectedSite}
//                   </Title>
//                   <Text type="secondary" style={{ fontSize: "11px" }}>
//                     {filteredLocations.length} Godowns •{" "}
//                     {searchTerm
//                       ? `Filtered from ${processedLocations.length} total`
//                       : `Total ${processedLocations.length}`}{" "}
//                     • Last Updated: {new Date().toLocaleTimeString()}
//                   </Text>
//                 </div>
//               </Space>
//             </Col>
//           </Row>
//         </Card>
//       </div>

//       {/* Legend Section */}
//       <Card size="small" style={{ marginBottom: 16, fontSize: "11px" }}>
//         <Row gutter={[8, 8]} justify="center">
//           <Col xs={24} md={6}>
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//               }}
//             >
//               <div
//                 style={{
//                   width: 12,
//                   height: 12,
//                   borderRadius: "50%",
//                   backgroundColor: STATUS_COLORS.normal,
//                   marginRight: 6,
//                 }}
//               />
//               <Text>
//                 Normal (CO₂ {getThresholdText(DEVICE_TYPES.CO2, 'normal')}, PH₃{" "}
//                 {getThresholdText(DEVICE_TYPES.PH3, 'normal')})
//               </Text>
//             </div>
//           </Col>
//           <Col xs={24} md={6}>
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//               }}
//             >
//               <div
//                 style={{
//                   width: 12,
//                   height: 12,
//                   borderRadius: "50%",
//                   backgroundColor: STATUS_COLORS.severe,
//                   marginRight: 6,
//                 }}
//               />
//               <Text>
//                 Severe (CO₂ {getThresholdText(DEVICE_TYPES.CO2, 'severe')}, PH₃{" "}
//                 {getThresholdText(DEVICE_TYPES.PH3, 'severe')})
//               </Text>
//             </div>
//           </Col>
//           <Col xs={24} md={6}>
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//               }}
//             >
//               <div
//                 style={{
//                   width: 12,
//                   height: 12,
//                   borderRadius: "50%",
//                   backgroundColor: STATUS_COLORS.critical,
//                   marginRight: 6,
//                 }}
//               />
//               <Text>
//                 Critical (CO₂ {getThresholdText(DEVICE_TYPES.CO2, 'critical')}, PH₃{" "}
//                 {getThresholdText(DEVICE_TYPES.PH3, 'critical')})
//               </Text>
//             </div>
//           </Col>
//           <Col xs={24} md={6}>
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//               }}
//             >
//               <div
//                 style={{
//                   width: 12,
//                   height: 12,
//                   borderRadius: "50%",
//                   backgroundColor: STATUS_COLORS.inactive,
//                   marginRight: 6,
//                 }}
//               />
//               <Text>
//                 Inactive (Device Offline)
//               </Text>
//             </div>
//           </Col>
//         </Row>
//       </Card>

//       {/* Godown Cards Grid */}
//       {filteredLocations.length > 0 ? (
//         <Row gutter={[16, 16]}>
//           {filteredLocations.map((location) => renderLocationCard(location))}
//         </Row>
//       ) : (
//         <Alert
//           message={searchTerm ? "No Matching Results" : "No Data Available"}
//           description={
//             searchTerm
//               ? `No godowns found matching "${searchTerm}". Try a different search term or clear the search.`
//               : "There are no godowns with device data to display."
//           }
//           type={searchTerm ? "warning" : "info"}
//           showIcon
//           style={{ margin: "20px 0" }}
//           action={
//             searchTerm && (
//               <Button size="small" onClick={handleClearSearch}>
//                 Clear Search
//               </Button>
//             )
//           }
//         />
//       )}

//       <div
//         style={{
//           marginTop: 16,
//           textAlign: "center",
//           padding: "12px 0",
//           borderTop: "1px solid #f0f0f0",
//           fontSize: "12px",
//           color: "#666",
//         }}
//       >
//         <Text type="secondary">
//           Display Dashboard • {selectedSite} •{" "}
//           {searchTerm
//             ? `Showing ${filteredLocations.length} filtered locations • `
//             : ""}
//           Auto-refresh every 30 seconds • Last Updated:{" "}
//           {new Date().toLocaleTimeString()} • Total Devices:{" "}
//           {filteredLocations.reduce((total, loc) => {
//             return total + (loc.devices ? loc.devices.length : 0);
//           }, 0)}
//         </Text>
//       </div>

//       <div className="fixed bottom-2 left-4 text-xs font-bold z-50 pointer-events-none">
//       </div>
//     </div>
//   );
// };

// export default DisplayDashboard;


//-------------------------below code of Total Count--------------------------------

import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Typography,
  Space,
  Divider,
  Select,
  Tooltip,
  Button,
  Badge,
  Tag,
  Statistic,
  Spin,
  Alert,
  Input,
  Modal,
  Table,
  DatePicker,
} from "antd";
import {
  PieChartOutlined,
  EnvironmentOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  SafetyOutlined,
  WifiOutlined,
  CloudOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  ClearOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { CO2API, gasFetch } from "../../../config";

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;
const { RangePicker } = DatePicker;

// CSS for heartbeat animation - Defined once at the top level
const heartbeatAnimationStyle = `
  @keyframes heartbeat {
    0% {
      transform: scale(1);
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    25% {
      transform: scale(1.02);
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    }
    50% {
      transform: scale(1.01);
      box-shadow: 0 3px 10px rgba(0,0,0,0.1);
    }
    75% {
      transform: scale(1.02);
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
  }
  
  .heartbeat-card {
    animation: heartbeat 1.5s ease-in-out infinite;
  }
`;

// Add the styles to the document head only once
if (!document.querySelector('style[data-heartbeat]')) {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.setAttribute('data-heartbeat', 'true');
  styleSheet.innerText = heartbeatAnimationStyle;
  document.head.appendChild(styleSheet);
}

// Color scheme for different status levels
const STATUS_COLORS = {
  normal: "#52c41a", // Green
  severe: "#faad14", // Orange
  critical: "#f5222d", // Red
  inactive: "#8c8c8c", // Gray for inactive
  default: "#d9d9d9", // Gray
  zeroCount: "#d9d9d9", // Gray for zero counts
};

// DateTime background colors based on card status
const DATETIME_BG_COLORS = {
  normal: {
    light: "#d9f7be", // Light green
    dark: "#52c41a", // Dark green for text/icons
    border: "#b7eb8f",
  },
  severe: {
    light: "#fff1b8", // Light orange
    dark: "#fa8c16", // Dark orange for text/icons
    border: "#ffd666",
  },
  critical: {
    light: "#ffccc7", // Light red
    dark: "#ff4d4f", // Dark red for text/icons
    border: "#ffa39e",
  },
  inactive: {
    light: "#f5f5f5", // Light gray
    dark: "#8c8c8c", // Dark gray for text/icons
    border: "#d9d9d9",
  },
  default: {
    light: "#e6f7ff", // Light blue
    dark: "#1890ff", // Blue for text/icons
    border: "#91d5ff",
  },
};

// Device type constants
const DEVICE_TYPES = {
  CO2: 30000,
  PH3: 30001,
};

// Static thresholds (will be replaced by API data)
const DEFAULT_THRESHOLDS = {
  [DEVICE_TYPES.CO2]: {
    normal: { min: 0, max: 600 },
    severe: { min: 600, max: 1500 },
    critical: { min: 1500, max: 5500 },
  },
  [DEVICE_TYPES.PH3]: {
    normal: { min: 0, max: 3 },
    severe: { min: 3, max: 7.5 },
    critical: { min: 7.5, max: 25 },
  },
};

// Determine status based on value and thresholds
const getStatus = (value, thresholds, deviceTypeId) => {
  // Handle inactive devices (null values)
  if (value === null || value === undefined) {
    return "inactive";
  }
  
  if (!thresholds[deviceTypeId]) {
    // Fallback to default thresholds if API data not loaded
    const defaultThresholds = DEFAULT_THRESHOLDS[deviceTypeId];
    if (value <= defaultThresholds.normal.max) return "normal";
    if (value <= defaultThresholds.severe.max) return "severe";
    return "critical";
  }

  if (value <= thresholds[deviceTypeId].normal.max) return "normal";
  if (value <= thresholds[deviceTypeId].severe.max) return "severe";
  return "critical";
};

// Get overall location status based on both CO2 and Phosphine
const getOverallLocationStatus = (locationData, thresholds) => {
  if (!locationData || locationData.length === 0) return "default";

  let co2Status = "default";
  let ph3Status = "default";

  locationData.forEach((device) => {
    const status = getStatus(device.value, thresholds, device.deviceTypeId);
    if (device.deviceTypeId === DEVICE_TYPES.CO2) {
      co2Status = status;
    } else if (device.deviceTypeId === DEVICE_TYPES.PH3) {
      ph3Status = status;
    }
  });

  // Return the worst status
  if (co2Status === "critical" || ph3Status === "critical") return "critical";
  if (co2Status === "severe" || ph3Status === "severe") return "severe";
  if (co2Status === "normal" || ph3Status === "normal") return "normal";
  if (co2Status === "inactive" || ph3Status === "inactive") return "inactive";
  return "default";
};

// Get status color
const getStatusColor = (status) =>
  STATUS_COLORS[status] || STATUS_COLORS.default;

// Get status icon
const getStatusIcon = (status) => {
  switch (status) {
    case "normal":
      return (
        <SafetyOutlined
          style={{ color: STATUS_COLORS.normal, fontSize: "14px" }}
        />
      );
    case "severe":
      return (
        <WarningOutlined
          style={{ color: STATUS_COLORS.severe, fontSize: "14px" }}
        />
      );
    case "critical":
      return (
        <WarningOutlined
          style={{ color: STATUS_COLORS.critical, fontSize: "14px" }}
        />
      );
    case "inactive":
      return (
        <ExclamationCircleOutlined
          style={{ color: STATUS_COLORS.inactive, fontSize: "14px" }}
        />
      );
    default:
      return null;
  }
};

// Get the latest dateTime from devices in a location
const getLatestDateTime = (devices) => {
  if (!devices || devices.length === 0) return null;
  
  // Filter out null dateTimes
  const validDateTimes = devices
    .map(device => device.dateTime)
    .filter(dateTime => dateTime !== null);
    
  if (validDateTimes.length === 0) return null;
  
  // Find the latest dateTime
  const latest = validDateTimes.reduce((latest, current) => {
    return new Date(current) > new Date(latest) ? current : latest;
  }, validDateTimes[0]);
  
  return latest;
};

// Format date time for display
const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return null;
  
  try {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      full: date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    };
  } catch (error) {
    console.error('Error formatting date:', error);
    return null;
  }
};

// Radial Gauge Component
const RadialGauge = ({ value, thresholds, deviceTypeId, maxValue = null }) => {
  const status = getStatus(value, thresholds, deviceTypeId);
  
  // Handle inactive devices
  if (status === "inactive") {
    return (
      <div
        style={{
          position: "relative",
          width: "80px",
          height: "80px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: STATUS_COLORS.inactive,
            opacity: 0.3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ExclamationCircleOutlined 
            style={{ 
              fontSize: "24px", 
              color: STATUS_COLORS.inactive 
            }} 
          />
        </div>
        <div
          style={{
            position: "absolute",
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "white",
            top: "10px",
            left: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                color: STATUS_COLORS.inactive,
              }}
            >
              Offline
            </div>
            <div style={{ fontSize: "10px", color: "#666" }}>Device</div>
          </div>
        </div>
      </div>
    );
  }
  
  // Determine max value for percentage calculation
  let maxValueForGauge = maxValue;
  if (!maxValueForGauge && thresholds[deviceTypeId]) {
    maxValueForGauge = thresholds[deviceTypeId].critical.max;
  } else if (!maxValueForGauge) {
    maxValueForGauge = deviceTypeId === DEVICE_TYPES.CO2 ? 5500 : 25;
  }
  
  const percentage = Math.min(100, (value / maxValueForGauge) * 100);

  return (
    <div
      style={{
        position: "relative",
        width: "80px",
        height: "80px",
        margin: "0 auto",
      }}
    >
      {/* Outer ring */}
      <div
        style={{
          position: "absolute",
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: `conic-gradient(${getStatusColor(
            status
          )} 0% ${percentage}%, #f5f5f5 ${percentage}% 100%)`,
          boxShadow: `0 0 8px ${getStatusColor(status)}40`,
        }}
      />

      {/* Inner circle */}
      <div
        style={{
          position: "absolute",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: "white",
          top: "10px",
          left: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: deviceTypeId === DEVICE_TYPES.CO2 ? "16px" : "14px",
              fontWeight: "bold",
              color: getStatusColor(status),
            }}
          >
            {deviceTypeId === DEVICE_TYPES.CO2 ? value : value.toFixed(2)}
          </div>
          <div style={{ fontSize: "10px", color: "#666" }}>ppm</div>
        </div>
      </div>
    </div>
  );
};

// DateTime Display Component
const DateTimeDisplay = ({ dateTime, status = "default" }) => {
  const formattedDateTime = formatDateTime(dateTime);
  const colorTheme = DATETIME_BG_COLORS[status] || DATETIME_BG_COLORS.default;

  return (
    <Tooltip title={`Last Updated: ${formattedDateTime ? formattedDateTime.full : "No data"}`}>
      <div
        style={{
          backgroundColor: colorTheme.light,
          borderRadius: "6px",
          padding: "2px 6px",
          border: `1px solid ${colorTheme.border}`,
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          cursor: "pointer",
          transition: "all 0.2s ease",
          minWidth: "110px",
          justifyContent: "center",
          height: "28px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)";
        }}
      >
        {formattedDateTime ? (
          <Space size={2} align="center">
            <CalendarOutlined style={{ 
              fontSize: "10px", 
              color: colorTheme.dark,
              fontWeight: "bold" 
            }} />
            <Text style={{ 
              fontSize: "11px", 
              color: colorTheme.dark,
              fontWeight: "bold" 
            }}>
              {formattedDateTime.date}
            </Text>
            <Text style={{ 
              fontSize: "11px", 
              color: colorTheme.dark,
              fontWeight: "bold" 
            }}>
              {formattedDateTime.time}
            </Text>
          </Space>
        ) : (
          <Space size={2} align="center">
            <ExclamationCircleOutlined style={{ 
              fontSize: "10px", 
              color: colorTheme.dark 
            }} />
            <Text style={{ 
              fontSize: "11px", 
              color: colorTheme.dark,
              fontWeight: "bold" 
            }}>
              No Data
            </Text>
          </Space>
        )}
      </div>
    </Tooltip>
  );
};

// DisplayDashboard Component
const DisplayDashboard = () => {
  // const [selectedSite, setSelectedSite] = useState("Sonipat (Haryana)");
  // const [selectedSite, setSelectedSite] = useState("Gadag-1 (Bengaluru)");
  const [selectedSite, setSelectedSite] = useState("Karnal-1 (Haryana)");
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [thresholds, setThresholds] = useState({});
  const [locationData, setLocationData] = useState({});
  const [processedLocations, setProcessedLocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredLocations, setFilteredLocations] = useState([]);
  
  // New states for alert data modal
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [alertsData, setAlertsData] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsTotalCount, setAlertsTotalCount] = useState(0);
  const [alertsPageNumber, setAlertsPageNumber] = useState(1);
  const [alertsPageSize, setAlertsPageSize] = useState(10);
  const [alertsFilters, setAlertsFilters] = useState({
    dateRange: null,
    alertType: null,
    deviceType: null,
    location: null,
  });
  
  // State to track if modal is opening (to prevent flicker)
  const [modalOpening, setModalOpening] = useState(false);

  // Process thresholds data from API
  const processThresholdsData = (apiData) => {
    const processed = {};
    
    apiData.forEach((item) => {
      if (!processed[item.deviceTypeId]) {
        processed[item.deviceTypeId] = {};
      }
      
      switch (item.alertType.toLowerCase()) {
        case 'normal':
          processed[item.deviceTypeId].normal = {
            min: item.minValue,
            max: item.maxValue,
          };
          break;
        case 'severe':
          processed[item.deviceTypeId].severe = {
            min: item.minValue,
            max: item.maxValue,
          };
          break;
        case 'critical':
          processed[item.deviceTypeId].critical = {
            min: item.minValue,
            max: item.maxValue,
          };
          break;
        default:
          break;
      }
    });
    
    return processed;
  };

  // Process location data from API
  const processLocationData = (apiData) => {
    const processed = [];
    
    Object.entries(apiData).forEach(([locationName, devices]) => {
      // Group devices by type
      const co2Devices = devices.filter(d => d.deviceTypeId === DEVICE_TYPES.CO2);
      const ph3Devices = devices.filter(d => d.deviceTypeId === DEVICE_TYPES.PH3);
      
      // Calculate total severe and critical counts for the location
      const totalSevereCount = devices.reduce((sum, device) => sum + (device.severeCount || 0), 0);
      const totalCriticalCount = devices.reduce((sum, device) => sum + (device.criticalCount || 0), 0);
      const hasAlerts = totalSevereCount > 0 || totalCriticalCount > 0;
      
      const location = {
        id: locationName,
        name: locationName,
        devices: devices, // Store raw device data
        co2Devices: co2Devices,
        ph3Devices: ph3Devices,
        hasMultipleCO2: co2Devices.length > 1,
        hasMultiplePH3: ph3Devices.length > 1,
        hasMultipleDevices: co2Devices.length > 1 || ph3Devices.length > 1,
        totalDevices: devices.length,
        totalSevereCount,
        totalCriticalCount,
        hasAlerts,
      };
      
      processed.push(location);
    });
    
    // Sort locations: 2-device cards first, 4-device cards last
    return processed.sort((a, b) => {
      // If both have multiple devices or both don't, maintain original order
      if (a.hasMultipleDevices === b.hasMultipleDevices) return 0;
      // Put 2-device cards (no multiple devices) first
      if (!a.hasMultipleDevices && b.hasMultipleDevices) return -1;
      // Put 4-device cards (multiple devices) last
      return 1;
    });
  };

  // Fetch total alerts count (just the count, not the data)
  const fetchAlertsTotalCount = async () => {
    try {
      const response = await gasFetch(
        `${CO2API}/api/device-alerts?pageNumber=1&pageSize=1`
      );
      const data = await response.json();
      setAlertsTotalCount(data.totalCount || 0);
    } catch (err) {
      console.error("Error fetching alerts total count:", err);
      setAlertsTotalCount(0);
    }
  };

  // Fetch data from APIs
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch thresholds
      const thresholdsResponse = await gasFetch(
        `${CO2API}/api/device-ranges`
      );
      const thresholdsData = await thresholdsResponse.json();
      const processedThresholds = processThresholdsData(thresholdsData);
      setThresholds(processedThresholds);

      // Fetch location alerts
      const alertsResponse = await gasFetch(
        `${CO2API}/api/device-logs/alerts`
      );
      const alertsData = await alertsResponse.json();
      const processedLocations = processLocationData(alertsData);
      setLocationData(alertsData);
      setProcessedLocations(processedLocations);
      setFilteredLocations(processedLocations); // Initialize filtered locations
      
      // Fetch alerts total count
      fetchAlertsTotalCount();
      
    } catch (err) {
      setError("Failed to fetch data. Please try again.");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch alert data with filters
  const fetchAlertsData = async () => {
    try {
      setAlertsLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        pageNumber: alertsPageNumber,
        pageSize: alertsPageSize,
      });
      
      // Add filters if present
      if (alertsFilters.dateRange && alertsFilters.dateRange.length === 2) {
        const [startDate, endDate] = alertsFilters.dateRange;
        params.append('startDate', startDate.format('YYYY-MM-DD'));
        params.append('endDate', endDate.format('YYYY-MM-DD'));
      }
      
      if (alertsFilters.alertType) {
        params.append('alertType', alertsFilters.alertType);
      }
      
      if (alertsFilters.deviceType) {
        params.append('deviceTypeId', alertsFilters.deviceType);
      }
      
      if (alertsFilters.location) {
        params.append('location', alertsFilters.location);
      }
      
      const response = await gasFetch(
        `${CO2API}/api/device-alerts?${params.toString()}`
      );
      const data = await response.json();
      
      setAlertsData(data.data || []);
      setAlertsTotalCount(data.totalCount || 0);
      setAlertsPageNumber(data.pageNumber || 1);
      setAlertsPageSize(data.pageSize || 10);
      
    } catch (err) {
      console.error("Error fetching alert data:", err);
      setAlertsData([]);
      setAlertsTotalCount(0);
    } finally {
      setAlertsLoading(false);
    }
  };

  // Open alerts modal smoothly
  const handleOpenAlertsModal = async () => {
    // Set modal as opening to prevent flicker
    setModalOpening(true);
    
    // First set the modal to open
    setShowAlertsModal(true);
    
    // Wait a tiny bit for the modal to render
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Then fetch the data
    await fetchAlertsData();
    
    // Reset the opening state
    setModalOpening(false);
  };

  // Close alerts modal
  const handleCloseAlertsModal = () => {
    setShowAlertsModal(false);
    setAlertsFilters({
      dateRange: null,
      alertType: null,
      deviceType: null,
      location: null,
    });
    setModalOpening(false);
  };

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setAlertsFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  // Apply filters
  const handleApplyFilters = () => {
    setAlertsPageNumber(1); // Reset to first page
    fetchAlertsData();
  };

  // Reset filters
  const handleResetFilters = () => {
    setAlertsFilters({
      dateRange: null,
      alertType: null,
      deviceType: null,
      location: null,
    });
    setAlertsPageNumber(1);
    fetchAlertsData();
  };

  // Handle pagination change
  const handlePaginationChange = (page, pageSize) => {
    setAlertsPageNumber(page);
    setAlertsPageSize(pageSize);
  };

  // Table columns for alerts
  const alertsColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: 'Device Type',
      dataIndex: 'deviceTypeId',
      key: 'deviceTypeId',
      width: 120,
      render: (deviceTypeId) => {
        if (deviceTypeId === DEVICE_TYPES.CO2) return 'CO₂';
        if (deviceTypeId === DEVICE_TYPES.PH3) return 'PH₃';
        return 'Unknown';
      },
      filters: [
        { text: 'CO₂', value: DEVICE_TYPES.CO2 },
        { text: 'PH₃', value: DEVICE_TYPES.PH3 },
      ],
      onFilter: (value, record) => record.deviceTypeId === value,
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 120,
    },
    {
      title: 'Godown',
      dataIndex: 'godown',
      key: 'godown',
      width: 100,
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 120,
    },
    {
      title: 'Value (ppm)',
      dataIndex: 'value',
      key: 'value',
      width: 120,
      render: (value, record) => {
        const isCO2 = record.deviceTypeId === DEVICE_TYPES.CO2;
        return isCO2 ? value.toFixed(0) : value.toFixed(2);
      },
      sorter: (a, b) => a.value - b.value,
    },
    {
      title: 'Alert Type',
      dataIndex: 'alertType',
      key: 'alertType',
      width: 120,
      render: (alertType) => {
        let color = '';
        switch (alertType?.toLowerCase()) {
          case 'severe':
            color = '#faad14';
            break;
          case 'critical':
            color = '#f5222d';
            break;
          case 'normal':
            color = '#52c41a';
            break;
          default:
            color = '#8c8c8c';
        }
        return (
          <Tag color={color} style={{ fontWeight: 'bold', margin: 0 }}>
            {alertType}
          </Tag>
        );
      },
      filters: [
        { text: 'Normal', value: 'Normal' },
        { text: 'Severe', value: 'Severe' },
        { text: 'Critical', value: 'Critical' },
      ],
      onFilter: (value, record) => record.alertType === value,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status ? 'success' : 'error'} style={{ margin: 0 }}>
          {status ? 'Active' : 'Inactive'}
        </Tag>
      ),
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Date & Time',
      dataIndex: 'regDate',
      key: 'regDate',
      width: 180,
      render: (regDate) => {
        if (!regDate) return '-';
        const date = new Date(regDate);
        return (
          <Tooltip title={date.toLocaleString()}>
            <Space size={4}>
              <CalendarOutlined style={{ fontSize: '12px' }} />
              <Text style={{ fontSize: '12px' }}>
                {date.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </Text>
              <ClockCircleOutlined style={{ fontSize: '12px', marginLeft: 4 }} />
              <Text style={{ fontSize: '12px' }}>
                {date.toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                })}
              </Text>
            </Space>
          </Tooltip>
        );
      },
      sorter: (a, b) => new Date(a.regDate) - new Date(b.regDate),
    },
  ];

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch alerts when page changes, but only if modal is open
  useEffect(() => {
    if (showAlertsModal && !modalOpening) {
      fetchAlertsData();
    }
  }, [alertsPageNumber, alertsPageSize, showAlertsModal]);

  // Filter locations based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredLocations(processedLocations);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = processedLocations.filter(location => {
      // Search in location name
      if (location.name.toLowerCase().includes(searchLower)) return true;
      
      // Search in all device IP addresses
      const allIPs = location.devices.map(d => d.ipAddress).filter(ip => ip);
      if (allIPs.some(ip => ip.toLowerCase().includes(searchLower))) return true;
      
      // Search in all device values
      const allValues = location.devices.map(d => d.value ? d.value.toString() : "inactive");
      if (allValues.some(val => val.includes(searchLower))) return true;
      
      // Search in status
      const overallStatus = getOverallLocationStatus(location.devices, thresholds);
      if (overallStatus.toLowerCase().includes(searchLower)) return true;
      
      // Search in individual device statuses
      const allStatuses = location.devices.map(device => 
        getStatus(device.value, thresholds, device.deviceTypeId)
      );
      if (allStatuses.some(status => status.toLowerCase().includes(searchLower))) return true;
      
      return false;
    });
    
    setFilteredLocations(filtered);
  }, [searchTerm, processedLocations, thresholds]);

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm("");
  };

  // Handle refresh
  const handleRefresh = () => {
    setSearchTerm(""); // Clear search on refresh
    setRefreshCounter((prev) => prev + 1);
    fetchData();
  };

  // Calculate summary statistics based on filtered locations
  const calculateSummary = () => {
    const totalGodowns = filteredLocations.length;
    
    // Calculate averages across all devices
    let totalCO2 = 0;
    let totalPH3 = 0;
    let co2Count = 0;
    let ph3Count = 0;

    filteredLocations.forEach((location) => {
      location.co2Devices.forEach(device => {
        if (device.value !== null && device.value !== undefined) {
          totalCO2 += device.value;
          co2Count++;
        }
      });
      location.ph3Devices.forEach(device => {
        if (device.value !== null && device.value !== undefined) {
          totalPH3 += device.value;
          ph3Count++;
        }
      });
    });

    const avgCO2 = co2Count > 0 ? Math.round(totalCO2 / co2Count) : 0;
    const avgPhosphine = ph3Count > 0 ? totalPH3 / ph3Count : 0;

    // Count statuses based on overall location status
    let normalCount = 0;
    let severeCount = 0;
    let criticalCount = 0;
    let inactiveCount = 0;

    filteredLocations.forEach((location) => {
      const overallStatus = getOverallLocationStatus(location.devices, thresholds);
      if (overallStatus === "normal") normalCount++;
      else if (overallStatus === "severe") severeCount++;
      else if (overallStatus === "critical") criticalCount++;
      else if (overallStatus === "inactive") inactiveCount++;
    });

    return {
      totalGodowns,
      avgCO2,
      avgPhosphine,
      normalCount,
      severeCount,
      criticalCount,
      inactiveCount,
    };
  };

  const summary = calculateSummary();

  // Get threshold text for legend
  const getThresholdText = (deviceTypeId, statusType) => {
    if (!thresholds[deviceTypeId] || !thresholds[deviceTypeId][statusType]) {
      const defaultThresholds = DEFAULT_THRESHOLDS[deviceTypeId];
      return statusType === 'normal' 
        ? `≤ ${defaultThresholds.normal.max} ppm`
        : statusType === 'severe'
        ? `≤ ${defaultThresholds.severe.max} ppm`
        : `≤ ${defaultThresholds.critical.max} ppm`;
    }
    
    return `≤ ${thresholds[deviceTypeId][statusType].max} ppm`;
  };

  // Render a standard location card (for 2 devices)
  const renderStandardLocationCard = (location) => {
    const overallStatus = getOverallLocationStatus(location.devices, thresholds);
    const latestDateTime = getLatestDateTime(location.devices);
    
    // Get the first CO2 and PH3 devices
    const co2Device = location.co2Devices[0];
    const ph3Device = location.ph3Devices[0];
    
    const co2Status = co2Device ? getStatus(co2Device.value, thresholds, DEVICE_TYPES.CO2) : "inactive";
    const phosphineStatus = ph3Device ? getStatus(ph3Device.value, thresholds, DEVICE_TYPES.PH3) : "inactive";

    // Check if card should have heartbeat animation
    const shouldHeartbeat = location.hasAlerts;
    
    // Card border color - use red if there are critical counts
    const borderColor = location.totalCriticalCount > 0 
      ? STATUS_COLORS.critical 
      : location.totalSevereCount > 0 
        ? STATUS_COLORS.severe 
        : getStatusColor(overallStatus);

    return (
      <Col xs={24} sm={12} md={8} lg={6} key={location.id}>
        <Card
          style={{
            height: "330px",
            border: `2px solid ${borderColor}`,
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            overflow: "hidden",
            transition: "all 0.3s ease",
            position: "relative",
          }}
          className={shouldHeartbeat ? "heartbeat-card" : ""}
          bodyStyle={{
            padding: "12px",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
          hoverable
        >
          {/* Card Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "8px",
            }}
          >
            <div>
              <Text strong style={{ fontSize: "16px", display: "block" }}>
                {"Location"}-{location.name}
              </Text>
            </div>
            {/* DateTime display */}
            <div style={{ textAlign: "right" }}>
              <DateTimeDisplay
                dateTime={latestDateTime} 
                status={overallStatus} 
              />
            </div>
          </div>

          {/* Device Information - Two columns showing severe and critical counts */}
          <Row gutter={[8, 8]} style={{ marginBottom: "16px" }}>
            {/* CO2 Device Information */}
            <Col span={12}>
              <div
                style={{
                  padding: "6px 8px",
                  backgroundColor: co2Status === "inactive" ? "#f5f5f5" : "#e6f7ff",
                  borderRadius: "4px",
                  border: `1px solid ${getStatusColor(co2Status)}30`,
                }}
              >
                <Space direction="vertical" size={2} style={{ width: "100%" }}>
                  <Space size={4}>
                    <CloudOutlined
                      style={{ 
                        fontSize: "12px", 
                        color: co2Status === "inactive" ? STATUS_COLORS.inactive : "#1890ff" 
                      }}
                    />
                    <Text strong style={{ fontSize: "11px", color: co2Status === "inactive" ? "#666" : "#000" }}>
                      CO₂ Device
                    </Text>
                  </Space>
                  {/* Severe and Critical Counts */}
                  <Row gutter={[4, 2]} style={{ marginTop: 2 }}>
                    <Col span={12}>
                      <div style={{ textAlign: "center" }}>
                        <Text strong style={{ 
                          fontSize: "14px", 
                          color: co2Device?.severeCount > 0 ? "#faad14" : STATUS_COLORS.zeroCount 
                        }}>
                          Severe
                        </Text>
                        <div style={{ 
                          fontSize: "14px", 
                          fontWeight: "bold", 
                          color: co2Device?.severeCount > 0 ? "#faad14" : STATUS_COLORS.zeroCount 
                        }}>
                          {co2Device?.severeCount || 0}
                        </div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ textAlign: "center" }}>
                        <Text strong style={{ 
                          fontSize: "14px", 
                          color: co2Device?.criticalCount > 0 ? "#f5222d" : STATUS_COLORS.zeroCount 
                        }}>
                          Critical
                        </Text>
                        <div style={{ 
                          fontSize: "14px", 
                          fontWeight: "bold", 
                          color: co2Device?.criticalCount > 0 ? "#f5222d" : STATUS_COLORS.zeroCount 
                        }}>
                          {co2Device?.criticalCount || 0}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Space>
              </div>
            </Col>

            {/* Phosphine Device Information */}
            <Col span={12}>
              <div
                style={{
                  padding: "6px 8px",
                  backgroundColor: phosphineStatus === "inactive" ? "#f5f5f5" : "#f6ffed",
                  borderRadius: "4px",
                  border: `1px solid ${getStatusColor(phosphineStatus)}30`,
                }}
              >
                <Space direction="vertical" size={2} style={{ width: "100%" }}>
                  <Space size={4}>
                    <CloudOutlined
                      style={{ 
                        fontSize: "12px", 
                        color: phosphineStatus === "inactive" ? STATUS_COLORS.inactive : "#52c41a" 
                      }}
                    />
                    <Text strong style={{ fontSize: "11px", color: phosphineStatus === "inactive" ? "#666" : "#000" }}>
                      PH₃ Device
                    </Text>
                  </Space>
                  {/* Severe and Critical Counts */}
                  <Row gutter={[4, 2]} style={{ marginTop: 2 }}>
                    <Col span={12}>
                      <div style={{ textAlign: "center" }}>
                        <Text strong style={{ 
                          fontSize: "14px", 
                          color: ph3Device?.severeCount > 0 ? "#faad14" : STATUS_COLORS.zeroCount 
                        }}>
                          Severe
                        </Text>
                        <div style={{ 
                          fontSize: "14px", 
                          fontWeight: "bold", 
                          color: ph3Device?.severeCount > 0 ? "#faad14" : STATUS_COLORS.zeroCount 
                        }}>
                          {ph3Device?.severeCount || 0}
                        </div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ textAlign: "center" }}>
                        <Text strong style={{ 
                          fontSize: "14px", 
                          color: ph3Device?.criticalCount > 0 ? "#f5222d" : STATUS_COLORS.zeroCount 
                        }}>
                          Critical
                        </Text>
                        <div style={{ 
                          fontSize: "14px", 
                          fontWeight: "bold", 
                          color: ph3Device?.criticalCount > 0 ? "#f5222d" : STATUS_COLORS.zeroCount 
                        }}>
                          {ph3Device?.criticalCount || 0}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Space>
              </div>
            </Col>
          </Row>

          {/* Gauge Display - Two gauges side by side */}
          <div
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            {/* CO2 Gauge */}
            <div style={{ width: "48%", textAlign: "center" }}>
              {co2Device ? (
                <>
                  <RadialGauge
                    value={co2Device.value}
                    thresholds={thresholds}
                    deviceTypeId={DEVICE_TYPES.CO2}
                  />
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "4px 6px",
                      backgroundColor: co2Status === "inactive" ? "#f5f5f5" : `${getStatusColor(co2Status)}15`,
                      borderRadius: "4px",
                      border: `1px solid ${co2Status === "inactive" ? STATUS_COLORS.inactive : getStatusColor(co2Status)}30`,
                    }}
                  >
                    <Space direction="vertical" size={2} align="center">
                      <Text
                        strong
                        style={{
                          fontSize: "12px",
                          color: getStatusColor(co2Status),
                        }}
                      >
                        CO₂: {co2Status === "inactive" ? "INACTIVE" : co2Status.toUpperCase()}
                      </Text>
                      <Text
                        type="secondary"
                        style={{ fontSize: "10px", color: "black" }}
                      >
                        {co2Status === "inactive" ? "Offline" : `${co2Device.value} ppm`}
                      </Text>
                      {/* IP Address moved to bottom */}
                      <Text
                        style={{
                          fontSize: "11px",
                          fontFamily: "monospace",
                          color: "#666",
                        }}
                      >
                        IP: {co2Device.ipAddress || "N/A"}
                      </Text>
                    </Space>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    height: "80px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                  }}
                >
                  <ExclamationCircleOutlined style={{ fontSize: "24px", color: STATUS_COLORS.inactive }} />
                  <Text type="secondary" style={{ fontSize: "12px", marginTop: "8px" }}>
                    No CO₂ Device
                  </Text>
                </div>
              )}
            </div>

            {/* Divider */}
            <Divider
              type="vertical"
              style={{ height: "80px", margin: "0 4px" }}
            />

            {/* Phosphine Gauge */}
            <div style={{ width: "48%", textAlign: "center" }}>
              {ph3Device ? (
                <>
                  <RadialGauge
                    value={ph3Device.value}
                    thresholds={thresholds}
                    deviceTypeId={DEVICE_TYPES.PH3}
                  />
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "4px 6px",
                      backgroundColor: phosphineStatus === "inactive" ? "#f5f5f5" : `${getStatusColor(phosphineStatus)}15`,
                      borderRadius: "4px",
                      border: `1px solid ${phosphineStatus === "inactive" ? STATUS_COLORS.inactive : getStatusColor(phosphineStatus)}30`,
                    }}
                  >
                    <Space direction="vertical" size={2} align="center">
                      <Text
                        strong
                        style={{
                          fontSize: "12px",
                          color: getStatusColor(phosphineStatus),
                        }}
                      >
                        PH₃: {phosphineStatus === "inactive" ? "INACTIVE" : phosphineStatus.toUpperCase()}
                      </Text>
                      <Text
                        type="secondary"
                        style={{ fontSize: "10px", color: "black" }}
                      >
                        {phosphineStatus === "inactive" ? "Offline" : `${ph3Device.value.toFixed(2)} ppm`}
                      </Text>
                      {/* IP Address moved to bottom */}
                      <Text
                        style={{
                          fontSize: "11px",
                          fontFamily: "monospace",
                          color: "#666",
                        }}
                      >
                        IP: {ph3Device.ipAddress || "N/A"}
                      </Text>
                    </Space>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    height: "80px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                  }}
                >
                  <ExclamationCircleOutlined style={{ fontSize: "24px", color: STATUS_COLORS.inactive }} />
                  <Text type="secondary" style={{ fontSize: "12px", marginTop: "8px" }}>
                    No PH₃ Device
                  </Text>
                </div>
              )}
            </div>
          </div>
          
          {/* Alert Indicator */}
          {shouldHeartbeat && (
            <div
              style={{
                position: "absolute",
                top: "4px",
                right: "4px",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: location.totalCriticalCount > 0 ? "#f5222d" : "#faad14",
                animation: "heartbeat 1.5s ease-in-out infinite",
              }}
            />
          )}  
        </Card>
      </Col>
    );
  };

  // Render a location card with multiple devices (like 3B with 4 devices)
  const renderMultiDeviceLocationCard = (location) => {
    const overallStatus = getOverallLocationStatus(location.devices, thresholds);
    const latestDateTime = getLatestDateTime(location.devices);
    const totalDevices = location.devices.length;
    
    const cardHeight = "330px";
    
    // Check if card should have heartbeat animation
    const shouldHeartbeat = location.hasAlerts;
    
    // Card border color - use red if there are critical counts
    const borderColor = location.totalCriticalCount > 0 
      ? STATUS_COLORS.critical 
      : location.totalSevereCount > 0 
        ? STATUS_COLORS.severe 
        : getStatusColor(overallStatus);

    return (
      <Col xs={24} sm={12} md={12} lg={12} key={location.id}>
        <Card
          style={{
            height: cardHeight,
            border: `2px solid ${borderColor}`,
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            overflow: "hidden",
            transition: "all 0.3s ease",
            position: "relative",
          }}
          className={shouldHeartbeat ? "heartbeat-card" : ""}
          bodyStyle={{
            padding: "12px",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
          hoverable
        >
          {/* Card Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "8px",
            }}
          >
            <div>
              <Text strong style={{ fontSize: "16px", display: "block" }}>
                {"Location"}-{location.name}
              </Text>
            </div>
            {/* DateTime display */}
            <div style={{ textAlign: "right" }}>
              <DateTimeDisplay 
                dateTime={latestDateTime} 
                status={overallStatus} 
              />
            </div>
          </div>

          {/* Device Information - 4 columns for 4 devices */}
          <div style={{ marginBottom: "16px" }}>
            <Row gutter={[8, 8]}>
              {location.devices.map((device, index) => {
                const status = getStatus(device.value, thresholds, device.deviceTypeId);
                return (
                  <Col span={6} key={`device-info-${index}`}>
                    <div
                      style={{
                        padding: "6px 8px",
                        backgroundColor: status === "inactive" ? "#f5f5f5" : 
                                       (device.deviceTypeId === DEVICE_TYPES.CO2 ? "#e6f7ff" : "#f6ffed"),
                        borderRadius: "4px",
                        border: `1px solid ${getStatusColor(status)}30`,
                        height: "100%",
                      }}
                    >
                      <Space direction="vertical" size={2} style={{ width: "100%" }}>
                        <Space size={4}>
                          <CloudOutlined
                            style={{ 
                              fontSize: "12px", 
                              color: status === "inactive" ? STATUS_COLORS.inactive : 
                                     (device.deviceTypeId === DEVICE_TYPES.CO2 ? "#1890ff" : "#52c41a") 
                            }}
                          />
                          <Text strong style={{ 
                            fontSize: "10px",
                            color: status === "inactive" ? "#666" : "#000"
                          }}>
                            {device.deviceTypeId === DEVICE_TYPES.CO2 ? "CO₂" : "PH₃"} {location.hasMultipleDevices ? `#${index + 1}` : ""}
                          </Text>
                        </Space>
                        {/* Severe and Critical Counts */}
                        <Row gutter={[4, 2]} style={{ marginTop: 2 }}>
                          <Col span={12}>
                            <div style={{ textAlign: "center" }}>
                              <Text strong style={{ 
                                fontSize: "14px", 
                                color: device.severeCount > 0 ? "#faad14" : STATUS_COLORS.zeroCount 
                              }}>
                                Severe
                              </Text>
                              <div style={{ 
                                fontSize: "14px", 
                                fontWeight: "bold", 
                                color: device.severeCount > 0 ? "#faad14" : STATUS_COLORS.zeroCount 
                              }}>
                                {device.severeCount || 0}
                              </div>
                            </div>
                          </Col>
                          <Col span={12}>
                            <div style={{ textAlign: "center" }}>
                              <Text strong style={{ 
                                fontSize: "14px", 
                                color: device.criticalCount > 0 ? "#f5222d" : STATUS_COLORS.zeroCount 
                              }}>
                                Critical
                              </Text>
                              <div style={{ 
                                fontSize: "14px", 
                                fontWeight: "bold", 
                                color: device.criticalCount > 0 ? "#f5222d" : STATUS_COLORS.zeroCount 
                              }}>
                                {device.criticalCount || 0}
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </Space>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </div>

          {/* Gauge Display - All 4 gauges in one row */}
          <div
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {location.devices.map((device, index) => {
              const status = getStatus(device.value, thresholds, device.deviceTypeId);
              return (
                <React.Fragment key={`gauge-container-${index}`}>
                  <div style={{ width: "25%", textAlign: "center" }}>
                    <RadialGauge
                      value={device.value}
                      thresholds={thresholds}
                      deviceTypeId={device.deviceTypeId}
                    />
                    <div
                      style={{
                        marginTop: "8px",
                        padding: "4px 6px",
                        backgroundColor: status === "inactive" ? "#f5f5f5" : `${getStatusColor(status)}15`,
                        borderRadius: "4px",
                        border: `1px solid ${status === "inactive" ? STATUS_COLORS.inactive : getStatusColor(status)}30`,
                      }}
                    >
                      <Space direction="vertical" size={2} align="center">
                        <Text
                          strong
                          style={{
                            fontSize: "12px",
                            color: getStatusColor(status),
                          }}
                        >
                          {device.deviceTypeId === DEVICE_TYPES.CO2 ? "CO₂" : "PH₃"}: {status === "inactive" ? "INACTIVE" : status.toUpperCase()}
                        </Text>
                        <Text
                          type="secondary"
                          style={{ fontSize: "10px", color: "black" }}
                        >
                          {status === "inactive" ? "Offline" : `${device.deviceTypeId === DEVICE_TYPES.CO2 ? device.value : device.value.toFixed(2)} ppm`}
                        </Text>
                        {/* IP Address moved to bottom */}
                        <Text
                          style={{
                            fontSize: "11px",
                            fontFamily: "monospace",
                            color: "#666",
                          }}
                        >
                          IP: {device.ipAddress || "N/A"}
                        </Text>
                      </Space>
                    </div>
                  </div>
                  {index < location.devices.length - 1 && (
                    <Divider
                      type="vertical"
                      style={{ height: "80px", margin: "0 4px" }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          
          {/* Alert Indicator */}
          {shouldHeartbeat && (
            <div
              style={{
                position: "absolute",
                top: "4px",
                right: "4px",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: location.totalCriticalCount > 0 ? "#f5222d" : "#faad14",
                animation: "heartbeat 1.5s ease-in-out infinite",
              }}
            />
          )}
        </Card>
      </Col>
    );
  };

  // Main render function for location card
  const renderLocationCard = (location) => {
    if (location.hasMultipleDevices && location.totalDevices > 2) {
      return renderMultiDeviceLocationCard(location);
    } else {
      return renderStandardLocationCard(location);
    }
  };

  if (loading && processedLocations.length === 0) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "100vh" 
      }}>
        <Spin size="large" tip="Loading dashboard data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={fetchData}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: "#f5f7fa",
        minHeight: "100vh",
      }}
    >
      {/* Header Section */}
      <div style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle" justify="space-between">
          <Col>
            <Title
              level={3}
              style={{ margin: 0, display: "flex", alignItems: "center" }}
            >
              <PieChartOutlined style={{ marginRight: 8, color: "#1890ff" }} />
              Display Dashboard
            </Title>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              Real-time monitoring of CO₂ and Phosphine levels across all godowns
            </Text>
          </Col>
          <Col>
            <Space wrap>
              {/* Total Count Button with Badge - Shows count by default */}
              <Badge
                count={alertsTotalCount}
                overflowCount={999}
                style={{ 
                  backgroundColor: alertsTotalCount > 0 ? '#f5222d' : '#1890ff',
                }}
              >
                <Button
                  type="default"
                  icon={<BarChartOutlined />}
                  onClick={handleOpenAlertsModal}
                  size="small"
                >
                  Total Count
                </Button>
              </Badge>
              
              {/* Search Bar */}
              <Input
                placeholder="Search location, IP, value..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: 200 }}
                size="small"
                allowClear
                suffix={
                  searchTerm && (
                    <ClearOutlined
                      onClick={handleClearSearch}
                      style={{ cursor: "pointer", color: "#999" }}
                    />
                  )
                }
              />
              
              {/* Search Results Count Badge */}
              {searchTerm && (
                <Badge
                  count={filteredLocations.length}
                  style={{ 
                    backgroundColor: filteredLocations.length > 0 ? '#1890ff' : '#f5222d',
                    marginRight: 8 
                  }}
                />
              )}
              
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                size="small"
                loading={loading}
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Search Status Info */}
        {searchTerm && (
          <Alert
            message={
              <span>
                Showing <strong>{filteredLocations.length}</strong> of{" "}
                <strong>{processedLocations.length}</strong> locations matching "
                <strong>{searchTerm}</strong>"
                {filteredLocations.length === 0 && (
                  <span> - No matching results found</span>
                )}
              </span>
            }
            type={filteredLocations.length > 0 ? "info" : "warning"}
            showIcon
            style={{ marginTop: 12, fontSize: "12px" }}
            action={
              searchTerm && (
                <Button size="small" type="link" onClick={handleClearSearch}>
                  Clear Search
                </Button>
              )
            }
          />
        )}

        {/* Site Information */}
        <Card
          size="small"
          style={{
            marginTop: 12,
            backgroundColor: "#e6f7ff",
            borderColor: "#91d5ff",
          }}
        >
          <Row align="middle" justify="space-between">
            <Col>
              <Space>
                <EnvironmentOutlined
                  style={{ fontSize: 16, color: "#1890ff" }}
                />
                <div>
                  <Title level={5} style={{ margin: 0 }}>
                    {selectedSite}
                  </Title>
                  <Text type="secondary" style={{ fontSize: "11px" }}>
                    {filteredLocations.length} Godowns •{" "}
                    {searchTerm
                      ? `Filtered from ${processedLocations.length} total`
                      : `Total ${processedLocations.length}`}{" "}
                    • Last Updated: {new Date().toLocaleTimeString()}
                  </Text>
                </div>
              </Space>
            </Col>
          </Row>
        </Card>
      </div>

      {/* Legend Section */}
      <Card size="small" style={{ marginBottom: 16, fontSize: "11px" }}>
        <Row gutter={[8, 8]} justify="center">
          <Col xs={24} md={6}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: STATUS_COLORS.normal,
                  marginRight: 6,
                }}
              />
              <Text>
                Normal (CO₂ {getThresholdText(DEVICE_TYPES.CO2, 'normal')}, PH₃{" "}
                {getThresholdText(DEVICE_TYPES.PH3, 'normal')})
              </Text>
            </div>
          </Col>
          <Col xs={24} md={6}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: STATUS_COLORS.severe,
                  marginRight: 6,
                }}
              />
              <Text>
                Severe (CO₂ {getThresholdText(DEVICE_TYPES.CO2, 'severe')}, PH₃{" "}
                {getThresholdText(DEVICE_TYPES.PH3, 'severe')})
              </Text>
            </div>
          </Col>
          <Col xs={24} md={6}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: STATUS_COLORS.critical,
                  marginRight: 6,
                }}
              />
              <Text>
                Critical (CO₂ {getThresholdText(DEVICE_TYPES.CO2, 'critical')}, PH₃{" "}
                {getThresholdText(DEVICE_TYPES.PH3, 'critical')})
              </Text>
            </div>
          </Col>
          <Col xs={24} md={6}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: STATUS_COLORS.inactive,
                  marginRight: 6,
                }}
              />
              <Text>
                Inactive (Device Offline)
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Godown Cards Grid */}
      {filteredLocations.length > 0 ? (
        <Row gutter={[16, 16]}>
          {filteredLocations.map((location) => renderLocationCard(location))}
        </Row>
      ) : (
        <Alert
          message={searchTerm ? "No Matching Results" : "No Data Available"}
          description={
            searchTerm
              ? `No godowns found matching "${searchTerm}". Try a different search term or clear the search.`
              : "There are no godowns with device data to display."
          }
          type={searchTerm ? "warning" : "info"}
          showIcon
          style={{ margin: "20px 0" }}
          action={
            searchTerm && (
              <Button size="small" onClick={handleClearSearch}>
                Clear Search
              </Button>
            )
          }
        />
      )}

      <div
        style={{
          marginTop: 16,
          textAlign: "center",
          padding: "12px 0",
          borderTop: "1px solid #f0f0f0",
          fontSize: "12px",
          color: "#666",
        }}
      >
        <Text type="secondary">
          Display Dashboard • {selectedSite} •{" "}
          {searchTerm
            ? `Showing ${filteredLocations.length} filtered locations • `
            : ""}
          Auto-refresh every 30 seconds • Last Updated:{" "}
          {new Date().toLocaleTimeString()} • Total Devices:{" "}
          {filteredLocations.reduce((total, loc) => {
            return total + (loc.devices ? loc.devices.length : 0);
          }, 0)}
        </Text>
      </div>


      {/* Alerts Modal - Fixed to prevent flickering */}
      <Modal
        title={
          <Space>
            <BarChartOutlined />
            <Text strong>Total Alerts Count: {alertsTotalCount}</Text>
          </Space>
        }
        open={showAlertsModal}
        onCancel={handleCloseAlertsModal}
        width={1200}
        footer={null}
        centered
        destroyOnClose={false}
        maskClosable={false}
        transitionName="" // Disable default transition to prevent flicker
      >
        {/* Filters Section */}
        <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f9f9f9' }}>
          <Row gutter={[16, 16]} align="middle">
            {/* <Col xs={24} sm={12} md={6}>
              <div>
                <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: 4 }}>
                  Date Range
                </Text>
                <RangePicker
                  size="small"
                  style={{ width: '100%' }}
                  value={alertsFilters.dateRange}
                  onChange={(dates) => handleFilterChange('dateRange', dates)}
                  placeholder={['Start Date', 'End Date']}
                />
              </div>
            </Col> */}
            <Col xs={24} sm={12} md={6}>
              <div>
                <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: 4 }}>
                  Alert Type
                </Text>
                <Select
                  size="small"
                  style={{ width: '100%' }}
                  placeholder="Select Alert Type"
                  value={alertsFilters.alertType}
                  onChange={(value) => handleFilterChange('alertType', value)}
                  allowClear
                >
                  <Option value="Normal">Normal</Option>
                  <Option value="Severe">Severe</Option>
                  <Option value="Critical">Critical</Option>
                </Select>
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div>
                <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: 4 }}>
                  Device Type
                </Text>
                <Select
                  size="small"
                  style={{ width: '100%' }}
                  placeholder="Select Device Type"
                  value={alertsFilters.deviceType}
                  onChange={(value) => handleFilterChange('deviceType', value)}
                  allowClear
                >
                  <Option value={DEVICE_TYPES.CO2}>CO₂</Option>
                  <Option value={DEVICE_TYPES.PH3}>PH₃</Option>
                </Select>
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Space style={{ width: '100%', justifyContent: 'flex-end', marginTop: 24 }}>
                <Button
                  size="small"
                  onClick={handleResetFilters}
                  icon={<ClearOutlined />}
                >
                  Reset
                </Button>
                <Button
                  type="primary"
                  size="small"
                  onClick={handleApplyFilters}
                  icon={<FilterOutlined />}
                  loading={alertsLoading}
                >
                  Apply Filters
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Table Section */}
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <Table
            columns={alertsColumns}
            dataSource={alertsData}
            rowKey="id"
            loading={alertsLoading}
            size="small"
            pagination={{
              current: alertsPageNumber,
              pageSize: alertsPageSize,
              total: alertsTotalCount,
              onChange: handlePaginationChange,
              onShowSizeChange: handlePaginationChange,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `Showing ${range[0]}-${range[1]} of ${total} alerts`,
            }}
            scroll={{ x: 'max-content' }}
            locale={{
              emptyText: (
                <div style={{ padding: '40px 0' }}>
                  <ExclamationCircleOutlined style={{ fontSize: '32px', color: '#d9d9d9', marginBottom: 16 }} />
                  <Text type="secondary">No alert data found</Text>
                </div>
              )
            }}
          />
        </div>
        
        {/* Summary Stats */}
        {alertsData.length > 0 && (
          <Card size="small" style={{ marginTop: 16, backgroundColor: '#f0f8ff' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Critical Alerts"
                  value={alertsData.filter(a => a.alertType === 'Critical').length}
                  valueStyle={{ color: '#f5222d', fontWeight: 'bold' }}
                  prefix={<WarningOutlined />}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Severe Alerts"
                  value={alertsData.filter(a => a.alertType === 'Severe').length}
                  valueStyle={{ color: '#faad14', fontWeight: 'bold' }}
                  prefix={<WarningOutlined />}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Active Alerts"
                  value={alertsData.filter(a => a.status).length}
                  valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                  prefix={<SafetyOutlined />}
                />
              </Col>
            </Row>
          </Card>
        )}
      </Modal>
    </div>
  );
};

export default DisplayDashboard;