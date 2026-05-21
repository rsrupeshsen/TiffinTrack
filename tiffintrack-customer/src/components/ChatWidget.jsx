import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store/useStore";
import { api } from "../lib/api";

export default function ChatWidget() {
  const { chatOpen, setChatOpen } = useStore();
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! I'm your TiffinTrack assistant 🍱 Tell me what kind of tiffin you're looking for — any cuisine, dietary preference, budget, or locality. I'll find the perfect match!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).slice(2));

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Focus input when chat opens
  useEffect(() => {
    if (chatOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [chatOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text) => {
    if (!text.trim()) return;

    const userMsg = { role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const data = await api.post("/api/chat", { message: text, sessionId });
      const botMsg = {
        role: "bot",
        text: data.message,
        providers: data.providers,
      };
      setMessages((m) => [...m, botMsg]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "bot", text: "Sorry, something went wrong. Try again!" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoice = () => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert("Voice input not supported in this browser. Try Chrome or Edge.");
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "en-IN";
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
    };
    rec.onerror = () => {
      alert("Voice recognition failed. Please try again.");
    };
    rec.start();
  };

  // Floating button when closed
  if (!chatOpen) {
    return (
      <button
        onClick={() => setChatOpen(true)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 500,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "var(--saffron)",
          color: "white",
          border: "none",
          fontSize: 26,
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(232, 103, 10, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.2s ease",
        }}
        onMouseEnter={(e) => (e.target.style.transform = "scale(1.1)")}
        onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
        aria-label="Open AI assistant"
      >
        ✨
      </button>
    );
  }

  // Full chat window
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 500,
        width: 380,
        maxWidth: "calc(100vw - 48px)",
        height: 540,
        maxHeight: "calc(100vh - 100px)",
        background: "white",
        borderRadius: 20,
        boxShadow: "0 24px 64px rgba(26, 20, 16, 0.2)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "1px solid #F0E8DC",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "var(--saffron)",
          padding: "14px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>🍱</span>
          <div>
            <div
              style={{
                color: "white",
                fontFamily: "Sora, sans-serif",
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              TiffinTrack AI
            </div>
            <div style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: 11 }}>
              Powered by Groq + Llama 3
            </div>
          </div>
        </div>
        <button
          onClick={() => setChatOpen(false)}
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            border: "none",
            borderRadius: "50%",
            width: 28,
            height: 28,
            color: "white",
            cursor: "pointer",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: msg.role === "user" ? "flex-end" : "flex-start",
              gap: 6,
            }}
          >
            <div
              className={
                msg.role === "user" ? "chat-bubble-user" : "chat-bubble-bot"
              }
            >
              {msg.text}
            </div>

            {/* Mini provider cards */}
            {msg.providers?.map((p) => (
              <div
                key={p.id}
                style={{
                  background: "#FDFAF5",
                  border: "1px solid #F0E8DC",
                  borderRadius: 10,
                  padding: "8px 12px",
                  width: "85%",
                  alignSelf: "flex-start",
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
                  {p.kitchen_name}
                </div>
                <div
                  style={{ fontSize: 12, color: "#6B5744", marginBottom: 6 }}
                >
                  📍 {p.locality} • ₹{p.price_per_day}/day
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <Link
                    to={`/kitchen/${p.id}`}
                    onClick={() => setChatOpen(false)}
                    style={{
                      fontSize: 12,
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: "var(--saffron-light)",
                      color: "var(--saffron-dark)",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    View
                  </Link>
                  {p.phone && (
                    <a
                      href={`https://wa.me/${p.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: 12,
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: "#E8F5EE",
                        color: "#2D6A4F",
                        textDecoration: "none",
                        fontWeight: 600,
                      }}
                    >
                      💬 WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="typing-indicator">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "10px 12px",
          borderTop: "1px solid #F0E8DC",
          display: "flex",
          gap: 6,
        }}
      >
        <button
          onClick={handleVoice}
          style={{
            background: "#F5EBE0",
            border: "none",
            borderRadius: "50%",
            width: 36,
            height: 36,
            cursor: "pointer",
            fontSize: 16,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Voice input"
        >
          🎤
        </button>

        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="e.g. veg udupi food under ₹70 near manipal…"
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 18,
            border: "1.5px solid #E8D8C8",
            fontSize: 13,
            outline: "none",
            fontFamily: "DM Sans, sans-serif",
          }}
        />

        <button
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          style={{
            background: "var(--saffron)",
            border: "none",
            borderRadius: "50%",
            width: 36,
            height: 36,
            cursor: "pointer",
            color: "white",
            fontSize: 16,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: !input.trim() || loading ? 0.5 : 1,
          }}
        >
          →
        </button>
      </div>

      {/* Quick suggestions */}
      <div
        style={{
          padding: "0 12px 10px",
          display: "flex",
          gap: 6,
          overflowX: "auto",
        }}
      >
        {[
          "Veg Udupi under ₹60",
          "Non-veg near Manipal",
          "Delivers before 1pm",
        ].map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            style={{
              background: "#F5EBE0",
              border: "none",
              borderRadius: 999,
              padding: "4px 10px",
              fontSize: 11,
              color: "#6B5744",
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontWeight: 500,
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
