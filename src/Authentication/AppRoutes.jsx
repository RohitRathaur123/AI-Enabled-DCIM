// import React from 'react';
// import { Routes, Route } from 'react-router-dom';
// import MainDashboard from '../Component/MainDashboard/MainDashboard';
// import Reports from '../pages/Reports';
// import Alerts from '../pages/Alerts';
// import Settings from '../pages/Settings';
// import AddDevice from '../pages/AddDevice';
// import PhosphineReports from '../pages/PhosphineReports';
// import Shads from '../pages/Shads';
// import Location from '../pages/Location';
// import Column from '../pages/Column';
// import AddingDevice from '../pages/AddingDevice';
// import DisplayDashboard from '../Component/MainDashboard/DisplayDashboard';
// import DisplayDashboard_Animate from '../Component/MainDashboard/DisplayDashboard_Animate';
// import DeviceRange from '../pages/DeviceRange';
// import AddUser from '../pages/AddUser';
// import AddCompany from '../pages/AddCompany';
// import AddDeviceType from '../pages/AddDeviceType';
// import DeviceCategory from '../pages/DeviceCategory';
// import ToolBox from '../pages/ToolBox';

// import DCIMViewer from '../Component/MainDashboard/DCIMViewer';
// // import "../Component/MainDashboard/DCIMViewer.css";



 
 
 
 
// const AppRoutes = () => {
//   return (
//     <Routes>
//       {/* Dashboard */}
//       <Route path="/dashboard" element={<MainDashboard />} />
//       <Route path="/display-dash" element={<DisplayDashboard />} />
//       <Route path="/display-dash-animate" element={<DisplayDashboard_Animate />} />

//       <Route path="/display-dash-animate" element={<DCIMViewer />} />

//       <Route path="/co2-reports" element={<Reports />} />
//       <Route path="/phosphine-reports" element={<PhosphineReports />} />
//       <Route path="/alerts" element={<Alerts />} />
//       <Route path="/settings" element={<Settings />} />
//       {/* <Route path="/add-device" element={<AddDevice />} /> */}
//       <Route path="/add-device" element={<AddingDevice />} />
//       <Route path="/device-range" element={<DeviceRange />} />

//       <Route path="/godown" element={<Shads />} />
//       <Route path="/location" element={<Location />} />
//       <Route path="/compartment" element={<Column />} />

//       <Route path="/add-user" element={<AddUser />} />
//       <Route path="/add-company" element={<AddCompany />} />

//       <Route path="/add-device-type" element={<AddDeviceType />} />
//       <Route path="/device-category" element={<DeviceCategory />} />
//       <Route path="/toolbox" element={<ToolBox />} />

//       <Route path="*" element={<MainDashboard />} />
      
   
      
//       {/* Default redirect */}
     
//     </Routes>
//   );
// };

// export default AppRoutes;





//--------------------------------------------------------------------

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainDashboard from '../Component/MainDashboard/MainDashboard';
import Reports from '../pages/Reports';
import Alerts from '../pages/Alerts';
import Settings from '../pages/Settings';
import PhosphineReports from '../pages/PhosphineReports';
import Shads from '../pages/Shads';
import Location from '../pages/Location';
import Column from '../pages/Column';
import AddingDevice from '../pages/AddingDevice';
import DisplayDashboard from '../Component/MainDashboard/DisplayDashboard';
import DisplayDashboard_Animate from '../Component/MainDashboard/DisplayDashboard_Animate';
import DeviceRange from '../pages/DeviceRange';
import AddUser from '../pages/AddUser';
import AddCompany from '../pages/AddTenant';
import AddDeviceType from '../pages/AddDeviceType';
import DeviceCategory from '../pages/DeviceCategory';
import DCIMViewer from '../Component/MainDashboard/DCIMViewer';
import Packages from '../pages/Packages';
import Billing from '../pages/Billing';
import AddSite from '../pages/AddSite';
import AddRole from '../pages/AddRole';
import ModalSpecification from '../pages/ModalSpecification';
import LifeCycle from '../pages/LifeCycle';
import Manufacturer from '../pages/Manufacturer';
import AssetDashboard from '../Component/MainDashboard/AssetDashboard';
import AddCountry from '../pages/AddCountry';
import AddState from '../pages/AddState';
import AddCity from '../pages/AddCity';
import AddTenant from '../pages/AddTenant';
import AddDataCenter from '../pages/AddDataCenter';
import AddRoom from '../pages/AddRoom';
import AddService from '../pages/AddService';
// Ticket Management: Ticket API tabs (ported from the reference portal) + the 5D View tickets tab
import TicketDashboard from '../ticket/ticketdashboard';
// Master: Area, Company, Device, Room, Floor, Rack... as tabs (ported from the reference portal)
import MasterDashboard from '../Layout/MasterDashboard';
import ChangeManagement from '../pages/ChangeManagement';
import AuditPage from '../pages/AuditPage';
import DiscoveryTool from '../pages/DiscoveryTool';
import RulesEngine from '../pages/RulesEngine';

// ── AppRoutes now accepts roomToZoom from Layout and passes it to DCIMViewer ──
const AppRoutes = ({ roomToZoom }) => {
  return (
    <Routes>
      <Route path="/dashboard"             element={<MainDashboard />} />
      <Route path="/display-dash"          element={<DisplayDashboard />} />
      <Route path="/display-dash-animate"  element={<DisplayDashboard_Animate />} />
      <Route path="/add-rule"  element={<RulesEngine />} />

      {/* Pass roomToZoom directly — no extra wrapper component needed */}
      <Route
        path="/display-dash-animate"
        element={
          <div style={{ height: 'calc(100vh - 96px)' }}>
            <DCIMViewer roomToZoom={roomToZoom} />
          </div>
        }
      />

      <Route path="/packages"      element={<Packages />} />
      <Route path="/billing"      element={<Billing />} />
      <Route path="/add-site"      element={<AddSite />} />
      <Route path="/add-role"      element={<AddRole />} />
      <Route path="/modal-specs"      element={<ModalSpecification />} />
      <Route path="/life-cycle"      element={<LifeCycle />} />
      <Route path="/add-manufacturer"      element={<Manufacturer />} />
      <Route path="/asset-dashboard"      element={<AssetDashboard />} />
      <Route path="/add-country"      element={<AddCountry />} />
      <Route path="/add-state"      element={<AddState />} />
      <Route path="/add-city"      element={<AddCity />} />
      <Route path="/add-datacenter"      element={<AddDataCenter />} />
      <Route path="/add-room"      element={<AddRoom />} />
      <Route path="/add-service"      element={<AddService />} />
      <Route path="/ticket"      element={<TicketDashboard />} />
      <Route path="/master"      element={<MasterDashboard />} />
      <Route path="/ticket-change-management" element={<ChangeManagement />} />
      <Route path="/ticket-audit"             element={<AuditPage />} />
      <Route path="/discovery-tool"           element={<DiscoveryTool />} />
      {/* <Route path="/3DView"      element={<DataCenter3DView />} /> */}

      <Route path="/co2-reports"      element={<Reports />} />
      <Route path="/phosphine-reports" element={<PhosphineReports />} />
      <Route path="/alerts"           element={<Alerts />} />
      <Route path="/settings"         element={<Settings />} />
      <Route path="/add-device"       element={<AddingDevice />} />
      <Route path="/device-range"     element={<DeviceRange />} />
      <Route path="/godown"           element={<Shads />} />
      <Route path="/add-location"     element={<Location />} />
      <Route path="/compartment"      element={<Column />} />
      <Route path="/add-user"         element={<AddUser />} />
      <Route path="/add-tenant"      element={<AddTenant />} />
      <Route path="/add-device-type"  element={<AddDeviceType />} />
      <Route path="/device-category"  element={<DeviceCategory />} />
      <Route path="*"                 element={<DisplayDashboard_Animate />} />
    </Routes>
  );
};

export default AppRoutes;