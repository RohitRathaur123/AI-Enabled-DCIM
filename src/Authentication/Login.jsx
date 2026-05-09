import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  message,
  Spin,
  Card,
  Typography,
  Alert,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
import { useAuth } from "./AuthContext";
import dcim from "../assets/dcim_copy.png";

const { Title, Text } = Typography;

const LoginPage = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  // Static credentials
  const STATIC_USERNAME = "admin";
  const STATIC_PASSWORD = "admin";

  const handleFinish = async (values) => {
    setLoading(true);
    setLoginError("");

    // Simulate API delay
    setTimeout(() => {
      try {
        if (values.username === STATIC_USERNAME && values.password === STATIC_PASSWORD) {
          const userData = {
            id: "1",
            username: values.username,
            token: "static-token-12345",
            role: "admin",
            refreshToken: "static-refresh-token",
          };

          localStorage.setItem("authToken", userData.token);
          localStorage.setItem("userData", JSON.stringify(userData));

          login(userData);

          message.success("Login successful! Redirecting to dashboard...");
          setTimeout(() => navigate("/dcim-viewer"), 800);
        } else {
          setLoginError(
            "Invalid username or password. Use 'admin' / 'admin' to login.",
          );
        }
      } catch (error) {
        console.error("Login error:", error);
        setLoginError("An unexpected error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e6f0ff 0%, #f0f7ff 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, 'Segoe UI', sans-serif",
        backgroundImage: `url(${dcim})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Card
        style={{
          width: 380, // Reduced from 400
          boxShadow: "0 8px 32px rgba(24, 144, 255, 0.12)",
          border: "1px solid #bae7ff",
          borderRadius: 16,
          padding: "8px 4px", // Reduced padding
        }}
      >
        <div style={{ textAlign: "center", paddingBottom: 16 }}> {/* Reduced from 30 */}
          <div
            style={{
              width: 48, // Reduced from 56
              height: 48, // Reduced from 56
              borderRadius: "50%",
              background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
              margin: "0 auto 8px auto", // Reduced bottom margin
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DashboardOutlined style={{ color: "#fff", fontSize: 28 }} /> {/* Reduced from 32 */}
          </div>
          <Title
            level={4} // Changed from level 3
            style={{ fontWeight: 600, color: "#096dd9", marginBottom: 0, fontSize: "20px" }}
          >
            DCIM
          </Title>
          <Text type="primary" style={{ fontSize: 13 }}> {/* Reduced from 15 */}
            Data Center Infrastructure Management
          </Text>
        </div>

        {/* Guide hint alert */}
        <Alert
          message="Demo Login Credentials"
          description="Username: admin | Password: admin"
          type="info"
          showIcon
          style={{
            marginBottom: 16, // Reduced from 20
            borderRadius: 8,
            backgroundColor: "#e6f7ff",
            border: "1px solid #91d5ff",
            fontSize: "12px", // Smaller text
            padding: "8px 12px", // Reduced padding
          }}
        />

        {loginError && (
          <Alert
            message="Login Failed"
            description={loginError}
            type="error"
            showIcon
            style={{
              marginBottom: 16, // Reduced from 20
              borderRadius: 8,
              border: "1px solid #ffa39e",
              backgroundColor: "#fff1f0",
              fontSize: "12px",
              padding: "8px 12px",
            }}
            closable
            onClose={() => setLoginError("")}
          />
        )}

        <Form
          layout="vertical"
          onFinish={handleFinish}
          requiredMark={false}
          autoComplete="off"
          initialValues={{
            username: STATIC_USERNAME,
            password: STATIC_PASSWORD,
          }}
          style={{ marginBottom: 0 }} // Reduced margin
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[
              {
                required: true,
                message: "Please enter your username",
              },
            ]}
            tooltip="Hint: Use 'admin' as username"
            validateStatus={loginError ? "error" : ""}
            style={{ marginBottom: 12 }} // Reduced from default
          >
            <Input
              size="middle" // Changed from "large" to "middle"
              placeholder="Enter username (admin)"
              prefix={<UserOutlined style={{ color: "#1890ff" }} />}
              style={{ backgroundColor: "#fff", height: "36px" }} // Fixed height
              onChange={() => loginError && setLoginError("")}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: "Please enter your password" },
            ]}
            style={{ marginBottom: 16 }} // Reduced margin
            tooltip="Hint: Use 'admin' as password"
            validateStatus={loginError ? "error" : ""}
          >
            <Input
              type={showPassword ? "text" : "password"}
              size="middle" // Changed from "large" to "middle"
              placeholder="Enter password (admin)"
              prefix={<LockOutlined style={{ color: "#1890ff" }} />}
              suffix={
                <span
                  onClick={() => setShowPassword((s) => !s)}
                  style={{
                    cursor: "pointer",
                    color: "#096dd9",
                    fontSize: 16, // Reduced from 18
                  }}
                  title="Toggle password visibility"
                >
                  {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                </span>
              }
              style={{ backgroundColor: "#fff", height: "36px" }} // Fixed height
              onChange={() => loginError && setLoginError("")}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 12 }}> {/* Reduced margin */}
            <Button
              type="primary"
              htmlType="submit"
              size="middle" // Changed from "large" to "middle"
              loading={loading}
              block
              style={{
                background: "linear-gradient(90deg, #1890ff 0%, #096dd9 100%)",
                border: "none",
                borderRadius: 8,
                marginTop: 8, // Reduced from 20
                fontWeight: 500,
                height: "38px", // Fixed height
              }}
              disabled={loading}
            >
              {loading ? (
                <Spin size="small" style={{ marginRight: 8 }} />
              ) : null}
              Sign in
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 12, textAlign: "center" }}> {/* Reduced from 18 */}
          <Text type="secondary" style={{ fontSize: 11 }}> {/* Reduced from 13 */}
            © {new Date().getFullYear()} DCIM Monitoring System
          </Text>
          <div
            style={{
              marginTop: 6, // Reduced from 10
              fontSize: 11, // Reduced from 12
              color: "#6b7280",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 8, // Reduced from 10
                height: 8, // Reduced from 10
                borderRadius: "50%",
                backgroundColor: "#1890ff",
                marginRight: 4, // Reduced from 5
              }}
            ></div>
            <span>Demo Account: admin / admin</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;