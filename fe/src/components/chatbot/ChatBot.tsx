import React, { useState, useRef } from "react";
import { api } from '../../../utils/axios';

const ChatBot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Xin chào! Tôi có thể giúp gì cho bạn về sản phẩm?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await api.post("/chatbot", {
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
      });
      setMessages([...newMessages, { role: "assistant", content: res.data.reply }]);
    } catch (err) {
      setMessages([...newMessages, { role: "assistant", content: "Xin lỗi, có lỗi xảy ra." }]);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <>
      {/* Nút icon hình tròn */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "#1976d2",
          color: "#fff",
          border: "none",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          zIndex: 1100,
          fontSize: 32,
          cursor: "pointer",
        }}
        aria-label={open ? "Đóng chat" : "Mở chat"}
      >
        🤖
      </button>
      {/* Khung chat */}
      {open && (
        <div style={{
          position: "fixed",
          bottom: 100,
          right: 24,
          width: 350,
          maxWidth: '95vw',
          background: "#fff",
          border: "1px solid #ccc",
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            background: "#1976d2",
            color: "#fff",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontWeight: 600,
            fontSize: 18,
            letterSpacing: 1,
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 22 }}>🤖</span> Trợ lý AI
            </span>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer' }} aria-label="Đóng chat">×</button>
          </div>
          {/* Nội dung chat */}
          <div
            className="chatbot-scrollbar"
            style={{
              padding: 16,
              height: 400,
              maxHeight: 400,
              minHeight: 400,
              overflowY: "auto",
              background: '#f7fafd',
              flex: 1,
            }}
          >
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                display: 'flex',
                flexDirection: msg.role === "user" ? 'row-reverse' : 'row',
                alignItems: 'flex-end',
                margin: "10px 0"
              }}>
                {/* Avatar */}
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: msg.role === "user" ? '#1976d2' : '#e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  color: msg.role === "user" ? '#fff' : '#1976d2',
                  margin: msg.role === "user" ? '0 0 0 8px' : '0 8px 0 0',
                  flexShrink: 0
                }}>
                  {msg.role === "user" ? '🧑' : '🤖'}
                </div>
                {/* Bubble */}
                <span style={{
                  display: "inline-block",
                  background: msg.role === "user" ? "#1976d2" : "#fff",
                  color: msg.role === "user" ? "#fff" : "#222",
                  padding: '10px 14px',
                  borderRadius: 16,
                  border: msg.role === "user" ? 'none' : '1px solid #e0e0e0',
                  maxWidth: "70%",
                  fontSize: 15,
                  boxShadow: msg.role === "user" ? '0 2px 8px rgba(25,118,210,0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
                  wordBreak: 'break-word',
                  marginLeft: msg.role === "user" ? 0 : 4,
                  marginRight: msg.role === "user" ? 4 : 0,
                }}>{msg.content}</span>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#1976d2' }}>🤖</div>
                <span style={{ background: '#fff', color: '#222', padding: '10px 14px', borderRadius: 16, border: '1px solid #e0e0e0', fontSize: 15, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  Đang trả lời...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          {/* Input */}
          <div style={{ display: "flex", borderTop: "1px solid #eee", padding: 12, background: '#fff' }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder="Nhập câu hỏi về sản phẩm..."
              style={{
                flex: 1,
                border: "1px solid #ccc",
                outline: "none",
                padding: '10px 12px',
                borderRadius: 8,
                fontSize: 15,
                background: '#f7fafd',
                marginRight: 8
              }}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{
                padding: '10px 18px',
                borderRadius: 8,
                border: "none",
                background: loading ? '#90caf9' : "#1976d2",
                color: "#fff",
                fontWeight: 600,
                fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {loading ? "..." : "Gửi"}
            </button>
          </div>
          {/* CSS thanh cuộn đẹp */}
          <style jsx global>{`
            .chatbot-scrollbar {
              scrollbar-width: thin;
              scrollbar-color: #1976d2 #e0e0e0;
            }
            .chatbot-scrollbar::-webkit-scrollbar {
              width: 7px;
              border-radius: 8px;
              background: #e0e0e0;
            }
            .chatbot-scrollbar::-webkit-scrollbar-thumb {
              background: #1976d2;
              border-radius: 8px;
            }
          `}</style>
        </div>
      )}
    </>
  );
};

export default ChatBot;
