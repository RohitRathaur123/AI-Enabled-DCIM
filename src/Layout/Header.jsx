import React, { useState, useEffect } from 'react';
import {
  FullscreenOutlined,
  FullscreenExitOutlined,
  BellOutlined,
  UserOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  SettingOutlined,
  LogoutOutlined,
  DashboardOutlined
} from '@ant-design/icons';
import { useAuth } from "../Authentication/AuthContext";
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { Tooltip, Avatar } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import profileLogo from "../assets/headerprofile.jpg";
import TicketAlertToggle from "../Component/Tickets/TicketAlertToggle";

const SIDEBAR_WIDTH = 270;
const SIDEBAR_COLLAPSED_WIDTH = 72;

const Header = ({ onToggle, collapsed, isMobile, showMobileSidebar }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.user-dropdown')) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const handleLogout = () => {
    Cookies.remove('token');
    logout();
    navigate('/');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log('Error attempting to enable fullscreen:', err.message);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleAlertsClick = () => {
    navigate('/alerts');
  };

  // Common styles for header buttons
  const headerButtonClass = "flex items-center justify-center h-9 w-9 rounded-full transition-all duration-200 hover:bg-[#deeaf5]";

  return (
    <header 
      className="fixed right-0 top-0 z-30 transition-all duration-300 ease-in-out"
      style={{
        left: isMobile ? 0 : (collapsed ? `${SIDEBAR_COLLAPSED_WIDTH}px` : `${SIDEBAR_WIDTH}px`),
        height: "64px",
        background: "linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)", // Blue theme
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid #1e40af",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)"
      }}
    >
      <div className="flex items-center justify-between h-full px-3 md:px-5">
        {/* Left Section */}
        <div className="flex items-center">
          {/* Toggle Button */}
          <Tooltip 
            title={isMobile ? (showMobileSidebar ? "Close Sidebar" : "Open Sidebar") : (collapsed ? "Expand Sidebar" : "Collapse Sidebar")}
            placement="bottom"
          >
            <button
              onClick={onToggle}
              className={`${headerButtonClass} text-white mr-2`}
              aria-label={isMobile ? (showMobileSidebar ? "Close Sidebar" : "Open Sidebar") : (collapsed ? "Expand Sidebar" : "Collapse Sidebar")}
            >
              {isMobile ? (
                showMobileSidebar ? 
                  <MenuFoldOutlined className="text-lg text-white" /> : 
                  <MenuUnfoldOutlined className="text-lg text-white" />
              ) : (
                collapsed ? 
                  <MenuUnfoldOutlined className="text-lg text-white" /> : 
                  <MenuFoldOutlined className="text-lg text-white" />
              )}
            </button>
          </Tooltip>
          
          {/* Title */}
          <div className="flex items-center">
            <motion.div 
              className="flex items-center space-x-3"
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[#1e40af] to-[#3b82f6] flex items-center justify-center">
                <DashboardOutlined className="text-white text-sm" />
              </div>
              <div>
                <h1 className="text-white font-bold tracking-wide" style={{ marginLeft: '0.5rem'}}>
                  {isMobile ? "DCIM Monitor" : "AI-Enabled DCIM Monitoring System"}
                </h1>
                {!isMobile && (
                  <div className="text-xs text-[#dbeafe]" style={{ marginLeft:'0.5rem'}}>
                    Monitor · Manage · Optimize
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Section with Action Buttons */}
        <div className="flex items-center space-x-1 md:space-x-2">
          {/* Ticket notifications on / off (bottom-right ticket toasts) */}
          <TicketAlertToggle compact={isMobile} />

          {/* Notifications - Static bell icon without badge */}
          <Tooltip title="View Alerts" placement="bottom">
            <button 
              onClick={handleAlertsClick}
              className={`${headerButtonClass} text-white relative`}
              aria-label="View alerts"
            >
              <BellOutlined className="text-lg" />
            </button>
          </Tooltip>

          {/* Fullscreen */}
          <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"} placement="bottom">
            <button 
              onClick={toggleFullscreen} 
              className={`${headerButtonClass} text-white hidden sm:flex`}
              aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <FullscreenExitOutlined className="text-lg" />
              ) : (
                <FullscreenOutlined className="text-lg" />
              )}
            </button>
          </Tooltip>

          {/* User Menu */}
          <div className="relative user-dropdown" style={{marginRight: isMobile ? '5px' : '30px'}}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center ml-1 transition-all duration-200"
              aria-expanded={showDropdown}
            >
              <div className="relative" >
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{ 
                    boxShadow: [
                      "0 0 0 rgba(37, 99, 235, 0)",
                      "0 0 0 2px rgba(37, 99, 235, 0.3)",
                      "0 0 0 rgba(37, 99, 235, 0)"
                    ] 
                  }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                />
                <Avatar 
                  src={profileLogo}
                  size={36}
                  className="border-2 border-white"
                />
              </div>
            </button>
            
            {/* User Dropdown Menu */}
            <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-64 origin-top-right z-50"
                style={{ 
                  background: 'linear-gradient(to bottom, #dbeafe, #fff)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 20px 25px -5px rgba(37,99,235,0.09), 0 10px 10px -5px rgba(37,99,235,0.06)'
                }}
              >
                <div style={{ 
                  padding: "12px 8px", 
                  backgroundColor: "white", 
                  borderRadius: "8px", 
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)" 
                }}>
                  <button 
                    style={{ 
                      width: "100%", 
                      textAlign: "left", 
                      padding: "12px 20px", 
                      margin: "4px 0", 
                      fontSize: "0.875rem", 
                      color: "#374151", 
                      borderRadius: "6px", 
                      transition: "all 0.3s ease-in-out", 
                      display: "flex", 
                      alignItems: "center", 
                      border: "none", 
                      backgroundColor: "transparent", 
                      cursor: "pointer" 
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = "#eff6ff";
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.05)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <UserOutlined style={{ marginRight: "12px", color: "#3b82f6", fontSize: "16px" }} /> 
                    <span style={{ fontWeight: "500" }}>My Profile</span>
                  </button>
                  
                  <button 
                    style={{ 
                      width: "100%", 
                      textAlign: "left", 
                      padding: "12px 20px", 
                      margin: "4px 0", 
                      fontSize: "0.875rem", 
                      color: "#374151", 
                      borderRadius: "6px", 
                      transition: "all 0.3s ease-in-out", 
                      display: "flex", 
                      alignItems: "center", 
                      border: "none", 
                      backgroundColor: "transparent", 
                      cursor: "pointer" 
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = "#eff6ff";
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.05)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <SettingOutlined style={{ marginRight: "12px", color: "#3b82f6", fontSize: "16px" }} /> 
                    <span style={{ fontWeight: "500" }}>Sensor Settings</span>
                  </button>
                  
                  <div style={{ 
                    borderTop: "1px solid #f3f4f6", 
                    margin: "8px 0" 
                  }}></div>
                  
                  <button 
                    onClick={handleLogout} 
                    style={{ 
                      width: "100%", 
                      textAlign: "left", 
                      padding: "12px 20px", 
                      margin: "4px 0", 
                      fontSize: "0.875rem", 
                      color: "#374151", 
                      borderRadius: "6px", 
                      transition: "all 0.3s ease-in-out", 
                      display: "flex", 
                      alignItems: "center", 
                      border: "none", 
                      backgroundColor: "transparent", 
                      cursor: "pointer" 
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = "#FEF2F2";
                      e.currentTarget.style.color = "#EF4444";
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.05)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#374151";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <LogoutOutlined style={{ marginRight: "12px", color: "#6B7280", fontSize: "16px" }} /> 
                    <span style={{ fontWeight: "500" }}>Logout</span>
                  </button>
                </div>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Global styles for dropdowns */}
      <style jsx global>{`
        .custom-dropdown-overlay .ant-dropdown-menu {
          background: transparent !important;
          box-shadow: none !important;
        }

        .custom-dropdown-overlay .ant-dropdown-menu-item {
          padding: 8px 12px !important;
          margin: 2px 8px !important;
          border-radius: 8px !important;
          color: #1e293b !important;
          transition: all 0.2s !important;
        }

        .custom-dropdown-overlay .ant-dropdown-menu-item:hover {
          background: #dbeafe !important;
          color: #2563eb !important;
        }
      `}</style>
    </header>
  );
};

export default Header;