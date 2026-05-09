import React, { useState } from "react";
import { CheckCircleOutlined, CloseCircleOutlined, CrownOutlined, ThunderboltOutlined, StarOutlined } from "@ant-design/icons";
import { message, Badge } from "antd";

const packages = [
  {
    id: "silver",
    name: "Silver",
    tagline: "Essential Monitoring",
    price: 4999,
    period: "/ month",
    icon: <StarOutlined />,
    gradient: "linear-gradient(145deg, #e8edf5 0%, #c8d3e0 40%, #a8b8cc 100%)",
    glowColor: "#94a3b8",
    accentColor: "#64748b",
    borderColor: "#cbd5e1",
    textColor: "#334155",
    badgeColor: "#64748b",
    shimmer: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%)",
    features: [
      { label: "Up to 2 Data Centers",         included: true  },
      { label: "Basic 3D Viewer",              included: true  },
      { label: "Real-time Alerts",             included: true  },
      { label: "Power Monitoring",             included: true  },
      { label: "5 User Accounts",              included: true  },
      { label: "Email Notifications",          included: true  },
      { label: "Advanced Analytics",           included: false },
      { label: "Custom Device Types",          included: false },
      { label: "API Access",                   included: false },
      { label: "Multi-site Management",        included: false },
      { label: "Predictive Maintenance",       included: false },
      { label: "Dedicated Support",            included: false },
    ],
  },
  {
    id: "gold",
    name: "Gold",
    tagline: "Professional Suite",
    price: 12999,
    period: "/ month",
    popular: true,
    icon: <CrownOutlined />,
    gradient: "linear-gradient(145deg, #fef9ec 0%, #fde68a 40%, #f59e0b 100%)",
    glowColor: "#f59e0b",
    accentColor: "#d97706",
    borderColor: "#fbbf24",
    textColor: "#78350f",
    badgeColor: "#d97706",
    shimmer: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.6) 50%, transparent 60%)",
    features: [
      { label: "Up to 10 Data Centers",        included: true  },
      { label: "Full 3D Viewer + ToolBox",     included: true  },
      { label: "Real-time Alerts",             included: true  },
      { label: "Power & Cooling Monitoring",   included: true  },
      { label: "25 User Accounts",             included: true  },
      { label: "Email + SMS Notifications",    included: true  },
      { label: "Advanced Analytics",           included: true  },
      { label: "Custom Device Types",          included: true  },
      { label: "API Access",                   included: true  },
      { label: "Multi-site Management",        included: false },
      { label: "Predictive Maintenance",       included: false },
      { label: "Dedicated Support",            included: false },
    ],
  },
  {
    id: "platinum",
    name: "Platinum",
    tagline: "Enterprise Command",
    price: 29999,
    period: "/ month",
    icon: <ThunderboltOutlined />,
    gradient: "linear-gradient(145deg, #f0f4ff 0%, #c7d2fe 40%, #818cf8 100%)",
    glowColor: "#6366f1",
    accentColor: "#4f46e5",
    borderColor: "#a5b4fc",
    textColor: "#312e81",
    badgeColor: "#4f46e5",
    shimmer: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.55) 50%, transparent 60%)",
    features: [
      { label: "Unlimited Data Centers",       included: true  },
      { label: "Full 3D Viewer + ToolBox",     included: true  },
      { label: "Real-time Alerts",             included: true  },
      { label: "Full Infrastructure Monitor",  included: true  },
      { label: "Unlimited User Accounts",      included: true  },
      { label: "All Notification Channels",    included: true  },
      { label: "Advanced Analytics",           included: true  },
      { label: "Custom Device Types",          included: true  },
      { label: "Full API Access",              included: true  },
      { label: "Multi-site Management",        included: true  },
      { label: "Predictive Maintenance",       included: true  },
      { label: "24/7 Dedicated Support",       included: true  },
    ],
  },
];

const PackageCard = ({ pkg, isSelected, onSelect }) => {
  const [hovered, setHovered] = useState(false);

  const elevated = hovered || isSelected;

  return (
    <div
      onClick={() => onSelect(pkg.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        borderRadius: 20,
        background: pkg.gradient,
        border: `2px solid ${elevated ? pkg.borderColor : "transparent"}`,
        boxShadow: elevated
          ? `0 24px 60px ${pkg.glowColor}40, 0 4px 16px ${pkg.glowColor}20, inset 0 1px 0 rgba(255,255,255,0.6)`
          : "0 4px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)",
        cursor: "pointer",
        transform: elevated ? "translateY(-8px) scale(1.02)" : "translateY(0) scale(1)",
        transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        flex: "1 1 300px",
        maxWidth: 360,
        minWidth: 280,
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      {/* Shimmer sweep on hover */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: pkg.shimmer,
          backgroundSize: "200% 100%",
          animation: hovered ? "shimmer 1.4s ease infinite" : "none",
          borderRadius: 18,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Popular badge */}
      {pkg.popular && (
        <div style={{
          position: "absolute",
          top: 18,
          right: -30,
          background: pkg.accentColor,
          color: "#fff",
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "1.2px",
          textTransform: "uppercase",
          padding: "5px 40px",
          transform: "rotate(35deg)",
          boxShadow: `0 2px 10px ${pkg.glowColor}60`,
          zIndex: 10,
        }}>
          Most Popular
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1, padding: "32px 28px 28px" }}>

        {/* Icon + Name */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
          <div style={{
            width: 52, height: 52,
            borderRadius: 14,
            background: `rgba(255,255,255,0.55)`,
            backdropFilter: "blur(4px)",
            border: `1.5px solid rgba(255,255,255,0.8)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24,
            color: pkg.accentColor,
            boxShadow: `0 4px 14px ${pkg.glowColor}30`,
            transition: "transform 0.3s",
            transform: elevated ? "rotate(-6deg) scale(1.1)" : "rotate(0) scale(1)",
          }}>
            {pkg.icon}
          </div>
          <div>
            <div style={{
              fontSize: 26,
              fontWeight: 800,
              color: pkg.textColor,
              fontFamily: "'Georgia', serif",
              letterSpacing: "-0.5px",
              lineHeight: 1,
            }}>
              {pkg.name}
            </div>
            <div style={{
              fontSize: 12,
              color: pkg.accentColor,
              fontWeight: 600,
              letterSpacing: "0.6px",
              textTransform: "uppercase",
              marginTop: 3,
            }}>
              {pkg.tagline}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          height: 1,
          background: `linear-gradient(90deg, ${pkg.glowColor}60, transparent)`,
          margin: "18px 0",
        }} />

        {/* Price */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
          <span style={{
            fontSize: 13,
            fontWeight: 600,
            color: pkg.accentColor,
            marginBottom: 4,
          }}>₹</span>
          <span style={{
            fontSize: 38,
            fontWeight: 900,
            color: pkg.textColor,
            fontFamily: "'Georgia', serif",
            lineHeight: 1,
            letterSpacing: "-1px",
          }}>
            {pkg.price.toLocaleString("en-IN")}
          </span>
          <span style={{
            fontSize: 13,
            color: pkg.accentColor,
            fontWeight: 500,
          }}>
            {pkg.period}
          </span>
        </div>

        {/* Features */}
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 28 }}>
          {pkg.features.map((f, i) => (
            <div key={i} style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              opacity: f.included ? 1 : 0.45,
            }}>
              {f.included
                ? <CheckCircleOutlined style={{ color: pkg.accentColor, fontSize: 15, flexShrink: 0 }} />
                : <CloseCircleOutlined style={{ color: pkg.textColor, fontSize: 15, flexShrink: 0, opacity: 0.4 }} />
              }
              <span style={{
                fontSize: 13,
                color: pkg.textColor,
                fontWeight: f.included ? 500 : 400,
                textDecoration: f.included ? "none" : "line-through",
              }}>
                {f.label}
              </span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(pkg.id); message.success(`${pkg.name} plan selected!`); }}
          style={{
            width: "100%",
            padding: "13px 0",
            borderRadius: 12,
            border: "none",
            background: isSelected
              ? pkg.accentColor
              : `rgba(255,255,255,0.65)`,
            color: isSelected ? "#fff" : pkg.accentColor,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.4px",
            cursor: "pointer",
            backdropFilter: "blur(4px)",
            boxShadow: isSelected
              ? `0 6px 20px ${pkg.glowColor}50`
              : `0 2px 8px rgba(0,0,0,0.08)`,
            transition: "all 0.25s ease",
            border: `1.5px solid ${isSelected ? "transparent" : `rgba(255,255,255,0.9)`}`,
          }}
          onMouseEnter={e => {
            if (!isSelected) {
              e.currentTarget.style.background = pkg.accentColor;
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.boxShadow = `0 6px 20px ${pkg.glowColor}50`;
            }
          }}
          onMouseLeave={e => {
            if (!isSelected) {
              e.currentTarget.style.background = "rgba(255,255,255,0.65)";
              e.currentTarget.style.color = pkg.accentColor;
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
            }
          }}
        >
          {isSelected ? "✓ Selected Plan" : `Choose ${pkg.name}`}
        </button>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -100% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

const Packages = () => {
  const [selectedPlan, setSelectedPlan] = useState("gold");
  const [billingCycle, setBillingCycle] = useState("monthly");

  return (
    <div style={{
      padding: "40px 32px",
      backgroundColor: "#f5f7fa",
      minHeight: "100vh",
      fontFamily: "'Segoe UI', sans-serif",
    }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
          border: "1px solid #bfdbfe",
          borderRadius: 100,
          padding: "6px 18px",
          marginBottom: 16,
        }}>
          <CrownOutlined style={{ color: "#3b82f6", fontSize: 13 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", letterSpacing: "0.8px", textTransform: "uppercase" }}>
            DCIM Access Plans
          </span>
        </div>

        <h1 style={{
          fontSize: 40,
          fontWeight: 900,
          color: "#0f172a",
          margin: "0 0 12px",
          fontFamily: "'Georgia', serif",
          letterSpacing: "-1px",
        }}>
          Choose Your Plan
        </h1>
        <p style={{
          fontSize: 16,
          color: "#64748b",
          margin: "0 auto",
          maxWidth: 520,
          lineHeight: 1.6,
        }}>
          Scale your data center infrastructure management with the right tier for your needs. 
          Upgrade or downgrade anytime.
        </p>

        {/* Billing toggle */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0,
          background: "#e2e8f0",
          borderRadius: 10,
          padding: 4,
          marginTop: 24,
        }}>
          {["monthly", "annual"].map(cycle => (
            <button
              key={cycle}
              onClick={() => setBillingCycle(cycle)}
              style={{
                padding: "8px 22px",
                borderRadius: 8,
                border: "none",
                background: billingCycle === cycle ? "#fff" : "transparent",
                color: billingCycle === cycle ? "#1e293b" : "#64748b",
                fontWeight: billingCycle === cycle ? 700 : 500,
                fontSize: 13,
                cursor: "pointer",
                boxShadow: billingCycle === cycle ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {cycle === "annual" && (
                <span style={{
                  background: "#22c55e",
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 800,
                  padding: "1px 6px",
                  borderRadius: 4,
                  letterSpacing: "0.4px",
                }}>
                  −20%
                </span>
              )}
              {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div style={{
        display: "flex",
        gap: 24,
        justifyContent: "center",
        flexWrap: "wrap",
        alignItems: "stretch",
        maxWidth: 1160,
        margin: "0 auto",
      }}>
        {packages.map(pkg => (
          <PackageCard
            key={pkg.id}
            pkg={pkg}
            isSelected={selectedPlan === pkg.id}
            onSelect={setSelectedPlan}
          />
        ))}
      </div>

      {/* Footer note */}
      <div style={{
        textAlign: "center",
        marginTop: 44,
        color: "#94a3b8",
        fontSize: 13,
      }}>
        All plans include 14-day free trial · No credit card required · Cancel anytime
        <br />
        <span style={{ fontSize: 12, marginTop: 6, display: "block" }}>
          Need a custom enterprise plan?{" "}
          <span
            style={{ color: "#3b82f6", fontWeight: 600, cursor: "pointer" }}
            onClick={() => message.info("Our team will contact you shortly!")}
          >
            Contact Sales →
          </span>
        </span>
      </div>

    </div>
  );
};

export default Packages;