import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { staticAssistantReply } from "../../staticData";

// ─────────────────────────────────────────
//  AI Assistant — global floating assistant
//  Reusable: rendered once in Layout.jsx, so it stays on screen (with its
//  chat history) on every page the user navigates to. Rendered through a
//  portal on document.body so it also floats above full-screen views
//  (e.g. the 5D View portal at zIndex 99990).
//  Replies come from the portal's own static data (src/staticData/assistant.js) —
//  no external AI service and no network request.
// ─────────────────────────────────────────
const AC = {
  blue: "#3b82f6",
  blueDark: "#1d4ed8",
  panel: "#ffffff",
  border: "#e2e8f0",
  text: "#1e293b",
  muted: "#64748b",
  bg: "#f8fafc",
  userBubble: "#3b82f6",
  botBubble: "#eef2ff",
  green: "#22c55e",
  red: "#ef4444",
  redDark: "#b91c1c",
};

const assistantStyles = `
  @keyframes ai-pop { from { opacity:0; transform: translateY(16px) scale(0.96); } to { opacity:1; transform: translateY(0) scale(1); } }
  @keyframes ai-pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
  @keyframes ai-bounce { 0%,60%,100% { transform: translateY(0); opacity:0.5; } 30% { transform: translateY(-4px); opacity:1; } }
  @keyframes ai-heartbeat {
    0%   { transform: scale(1);    box-shadow: 0 0 0 0 rgba(239,68,68,0.55); }
    14%  { transform: scale(1.35); }
    28%  { transform: scale(1);    box-shadow: 0 0 0 6px rgba(239,68,68,0); }
    42%  { transform: scale(1.35); }
    70%  { transform: scale(1); }
    100% { transform: scale(1); }
  }
  @keyframes ai-heartbeat-fab {
    0%   { transform: scale(1);    box-shadow: 0 6px 18px rgba(185,28,28,0.35), 0 0 0 0 rgba(239,68,68,0.55); }
    14%  { transform: scale(1.09); }
    28%  { transform: scale(1);    box-shadow: 0 6px 18px rgba(185,28,28,0.35), 0 0 0 12px rgba(239,68,68,0); }
    42%  { transform: scale(1.09); }
    70%  { transform: scale(1); }
    100% { transform: scale(1); }
  }
  .ai-panel { animation: ai-pop 0.22s ease-out; }
  .ai-dot { animation: ai-pulse 1.8s ease-in-out infinite; }
  .ai-heartbeat { animation: ai-heartbeat 1.2s ease-in-out infinite; }
  .ai-heartbeat-fab { animation: ai-heartbeat-fab 1.4s ease-in-out infinite; }
  .ai-typing-dot { animation: ai-bounce 1.2s infinite ease-in-out; }
  .ai-fab:hover { transform: scale(1.06); box-shadow: 0 8px 24px rgba(185,28,28,0.45); }
  .ai-scroll::-webkit-scrollbar { width: 5px; }
  .ai-scroll::-webkit-scrollbar-thumb { background: #c8d4ea; border-radius: 6px; }
`;

function RobotIcon({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* antenna */}
      <rect x="11.2" y="2.6" width="1.6" height="3.4" rx="0.8" fill="#fff" />
      <circle cx="12" cy="2.4" r="1.3" fill="#fff" />
      {/* ears */}
      <rect x="1.8" y="10" width="2" height="5" rx="1" fill="#fff" />
      <rect x="20.2" y="10" width="2" height="5" rx="1" fill="#fff" />
      {/* head */}
      <rect x="4.2" y="6" width="15.6" height="13" rx="3.6" fill="#fff" />
      {/* eyes */}
      <circle cx="9" cy="11.8" r="1.7" fill="#b91c1c" />
      <circle cx="15" cy="11.8" r="1.7" fill="#b91c1c" />
      <circle cx="9.5" cy="11.3" r="0.5" fill="#fff" />
      <circle cx="15.5" cy="11.3" r="0.5" fill="#fff" />
      {/* mouth */}
      <rect x="8.6" y="15.2" width="6.8" height="1.6" rx="0.8" fill="#b91c1c" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M3 11.5 20.5 4l-6.8 17.5-3.1-7.1-7.6-2.9Z" fill="#fff" />
    </svg>
  );
}

function UserAvatarIcon() {
  return (
    <div style={{ width: 26, height: 26, borderRadius: "50%", background: AC.blue, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" fill="#fff" />
        <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="#fff" />
      </svg>
    </div>
  );
}

function RobotAvatarIcon() {
  return (
    <div style={{ width: 26, height: 26, borderRadius: "50%", background: `linear-gradient(135deg, ${AC.red}, ${AC.redDark})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <rect x="9" y="3" width="2" height="5" rx="1" fill="#fff" />
        <circle cx="10" cy="3" r="1.4" fill="#fff" />
        <rect x="4" y="8" width="16" height="12" rx="3" fill="#fff" />
        <circle cx="9" cy="14" r="1.4" fill="#b91c1c" />
        <circle cx="15" cy="14" r="1.4" fill="#b91c1c" />
        <rect x="8" y="17" width="8" height="1.6" rx="0.8" fill="#b91c1c" />
      </svg>
    </div>
  );
}

// Answers from the static portal data, after a short "typing" pause.
async function fetchAssistantReply(nextMessages) {
  await new Promise((resolve) => setTimeout(resolve, 650));
  return staticAssistantReply(nextMessages);
}

export default function AIAssistant({ title = "Sovereign AI", bottom = 24, right = 24 }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi, I'm ${title} 👋 Ask me anything about this portal — power, cooling, alerts or assets.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isOpen]);

  async function handleSend(rawText) {
    const text = rawText.trim();
    if (!text || isLoading) return;

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const reply = await fetchAssistantReply(nextMessages);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err?.message || "The assistant could not answer right now.");
    } finally {
      setIsLoading(false);
    }
  }

  function sendMessage(e) {
    e.preventDefault();
    handleSend(input);
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div style={{ position: "fixed", bottom, right, zIndex: 100000, fontFamily: "'Exo 2', sans-serif" }}>
      <style>{assistantStyles}</style>

      {isOpen && (
        <div
          className="ai-panel"
          style={{
            width: 340,
            maxWidth: "calc(100vw - 32px)",
            height: 460,
            maxHeight: "calc(100vh - 120px)",
            background: AC.panel,
            borderRadius: 16,
            boxShadow: "0 12px 36px rgba(15,23,42,0.22)",
            border: `1px solid ${AC.border}`,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            marginBottom: 14,
          }}
        >
          {/* Header */}
          <div
            style={{
              background: `linear-gradient(135deg, ${AC.blue}, ${AC.blueDark})`,
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "#fff",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <RobotIcon size={20} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>{title}</div>
                <div style={{ fontSize: 10, opacity: 0.85, display: "flex", alignItems: "center", gap: 4 }}>
                  <span className="ai-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: AC.green, display: "inline-block" }} />
                  Online · AI assistant
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              aria-label={`Close ${title}`}
            >
              <CloseIcon />
            </button>
          </div>

          {/* Messages */}
          <div className="ai-scroll" style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 8, background: AC.bg }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: m.role === "user" ? "row-reverse" : "row",
                    alignItems: "flex-end",
                    gap: 6,
                    maxWidth: "88%",
                  }}
                >
                  {m.role === "user" ? <UserAvatarIcon /> : <RobotAvatarIcon />}
                  <div
                    style={{
                      minWidth: 0,
                      padding: "8px 12px",
                      borderRadius: 14,
                      fontSize: 12.5,
                      lineHeight: 1.45,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      background: m.role === "user" ? AC.userBubble : AC.botBubble,
                      color: m.role === "user" ? "#fff" : AC.text,
                      borderBottomRightRadius: m.role === "user" ? 4 : 14,
                      borderBottomLeftRadius: m.role === "user" ? 14 : 4,
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
                  <RobotAvatarIcon />
                  <div style={{ background: AC.botBubble, borderRadius: 14, borderBottomLeftRadius: 4, padding: "10px 14px", display: "flex", gap: 4 }}>
                    <span className="ai-typing-dot" style={{ width: 5, height: 5, borderRadius: "50%", background: AC.muted, animationDelay: "0s" }} />
                    <span className="ai-typing-dot" style={{ width: 5, height: 5, borderRadius: "50%", background: AC.muted, animationDelay: "0.15s" }} />
                    <span className="ai-typing-dot" style={{ width: 5, height: 5, borderRadius: "50%", background: AC.muted, animationDelay: "0.3s" }} />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div style={{ background: "#fee2e2", color: "#991b1b", fontSize: 11, padding: "6px 10px", borderRadius: 8 }}>
                ⚠ {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} style={{ display: "flex", gap: 8, padding: 10, borderTop: `1px solid ${AC.border}`, background: AC.panel }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Sovereign AI Assistant..."
              disabled={isLoading}
              style={{ flex: 1, padding: "8px 12px", borderRadius: 10, border: `1px solid ${AC.border}`, fontSize: 12.5, outline: "none" }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                border: "none",
                background: AC.blue,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
                opacity: isLoading || !input.trim() ? 0.5 : 1,
                flexShrink: 0,
              }}
              aria-label="Send message"
            >
              <SendIcon />
            </button>
          </form>
        </div>
      )}

      {/* Floating action button */}
      <button
        className={`ai-fab${!isOpen ? " ai-heartbeat-fab" : ""}`}
        onClick={() => setIsOpen((v) => !v)}
        style={{
          width: 58,
          height: 58,
          borderRadius: "50%",
          border: "none",
          background: `linear-gradient(135deg, ${AC.red}, ${AC.redDark})`,
          boxShadow: "0 6px 18px rgba(185,28,28,0.35)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
          marginLeft: "auto",
        }}
        aria-label={isOpen ? `Close ${title}` : `Open ${title}`}
        title={title}
      >
        {isOpen ? <CloseIcon /> : <RobotIcon />}
        {!isOpen && (
          <span
            className="ai-heartbeat"
            style={{ position: "absolute", top: 4, right: 4, width: 10, height: 10, borderRadius: "50%", background: AC.red, border: "2px solid #fff" }}
          />
        )}
      </button>
    </div>,
    document.body
  );
}
