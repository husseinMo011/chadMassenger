import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useRoom } from "../context/RoomContext";
import { useSocket } from "../context/SocketContext";
import { getMessages } from "../services/messageService";

function Avatar({ firstName, lastName, color, size = 32 }) {
  const initials = ((firstName?.[0] || "") + (lastName?.[0] || "")).toUpperCase() || "?";
  return (
    <div style={{
      width: size, height: size, minWidth: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${color || "#666"}, ${color || "#666"}88)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 700, color: "#fff",
    }}>
      {initials}
    </div>
  );
}

export default function ChatWindow() {
  const { user } = useAuth();
  const { activeContact, refreshContacts, setLastMessage, incrementUnread, clearUnread } = useRoom();
  const { emitMessage, addMessageListener, connected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const activeContactRef = useRef(activeContact);

  const userId = user?.id || user?._id;

  useEffect(() => {
    activeContactRef.current = activeContact;
  }, [activeContact]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  // Helper: reload messages from REST API
  const reloadMessages = useCallback(async (contactId) => {
    if (!contactId) return;
    try {
      const data = await getMessages(contactId);
      const msgs = data.messages || [];
      setMessages(msgs);
      if (msgs.length > 0) {
        const last = msgs[msgs.length - 1];
        const senderId = typeof last.sender === "object"
          ? last.sender._id || last.sender.id : last.sender;
        const text = last.content || last.text || "";
        const preview = senderId === userId ? `You: ${text}` : text;
        setLastMessage(contactId, preview, last.timestamp);
      }
      scrollToBottom();
    } catch (err) {
      console.error("Failed to reload messages:", err);
    }
  }, [userId, setLastMessage, scrollToBottom]);

  // Load message history when active contact changes
  useEffect(() => {
    if (!activeContact?._id) {
      setMessages([]);
      return;
    }
    clearUnread(activeContact._id);
    setLoading(true);
    setError("");
    getMessages(activeContact._id)
      .then((data) => {
        const msgs = data.messages || [];
        setMessages(msgs);
        if (msgs.length > 0) {
          const last = msgs[msgs.length - 1];
          const senderId = typeof last.sender === "object"
            ? last.sender._id || last.sender.id : last.sender;
          const text = last.content || last.text || "";
          const preview = senderId === userId ? `You: ${text}` : text;
          setLastMessage(activeContact._id, preview, last.timestamp);
        }
        scrollToBottom();
      })
      .catch((err) => {
        console.error("Failed to load messages:", err);
        setError("Failed to load conversation history");
        setMessages([]);
      })
      .finally(() => setLoading(false));
  }, [activeContact?._id]);

  // Listen for incoming messages from OTHER users via Socket.IO
  useEffect(() => {
    const handler = (message) => {
      const senderId = typeof message.sender === "object"
        ? message.sender._id || message.sender.id : message.sender;
      const recipientId = typeof message.recipient === "object"
        ? message.recipient._id || message.recipient.id : message.recipient;

      const isSentByMe = senderId === userId;
      const currentActive = activeContactRef.current;

      // Update sidebar
      const msgText = message.content || message.text || "";
      const msgTime = message.timestamp || new Date().toISOString();
      if (isSentByMe) {
        setLastMessage(recipientId, `You: ${msgText}`, msgTime);
      } else {
        setLastMessage(senderId, msgText, msgTime);
      }

      const isForActiveConvo =
        senderId === currentActive?._id ||
        (isSentByMe && recipientId === currentActive?._id);

      if (isForActiveConvo) {
        // Add message if not duplicate
        setMessages((prev) => {
          if (message._id && prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
        scrollToBottom();
      } else if (!isSentByMe) {
        incrementUnread(senderId);
      }

      refreshContacts();
    };

    const unsub = addMessageListener(handler);
    return unsub;
  }, [userId, addMessageListener, scrollToBottom, refreshContacts, setLastMessage, incrementUnread]);

  // Send text message
  const handleSend = () => {
    if (!input.trim() || !activeContact?._id) return;
    const text = input.trim();
    setInput("");

    // Update sidebar preview immediately
    setLastMessage(activeContact._id, `You: ${text}`, new Date().toISOString());

    // Emit via Socket.IO
    emitMessage(userId, activeContact._id, text, "text");

    // After a short delay, reload from REST API to confirm
    const contactId = activeContact._id;
    setTimeout(() => reloadMessages(contactId), 500);
  };

  // Empty state
  if (!activeContact) {
    return (
      <div style={styles.emptyWrap}>
        <div style={styles.emptyInner}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" style={{ marginBottom: 20, opacity: 0.4 }}>
            <rect x="8" y="14" width="64" height="44" rx="8" stroke="#00ff62" strokeWidth="2" fill="none"/>
            <circle cx="28" cy="36" r="4" fill="#00ff62" opacity="0.4"/>
            <circle cx="40" cy="36" r="4" fill="#00ff62" opacity="0.6"/>
            <circle cx="52" cy="36" r="4" fill="#00ff62" opacity="0.8"/>
            <rect x="24" y="58" width="32" height="6" rx="3" fill="#00ff62" opacity="0.3"/>
          </svg>
          <h2 style={styles.emptyTitle}>Select a conversation</h2>
          <p style={styles.emptyDesc}>Choose a contact from the sidebar or start a new conversation</p>
        </div>
      </div>
    );
  }

  const contactName = `${activeContact.firstName || ""} ${activeContact.lastName || ""}`.trim() || "Unknown";
  let lastDate = "";

  return (
    <div style={styles.chatMain}>
      {/* Header */}
      <div style={styles.chatHeader}>
        <Avatar firstName={activeContact.firstName} lastName={activeContact.lastName} color={activeContact.color} size={36} />
        <div>
          <div style={styles.headerName}>{contactName}</div>
          <div style={styles.headerMeta}>Direct Message</div>
        </div>
        {!connected && (
          <div style={styles.offlineBanner}>⚠ Connection lost — reconnecting...</div>
        )}
      </div>

      {error && (
        <div style={styles.errorBanner}>
          <span>⚠</span> {error}
          <button onClick={() => setError("")} style={styles.errorClose}>×</button>
        </div>
      )}

      {/* Messages */}
      <div style={styles.messagesArea}>
        {loading && (
          <div style={styles.loadingMsg}>
            <div style={{
              width: 24, height: 24, border: "2px solid transparent",
              borderTop: "2px solid #00ff62", borderRadius: "50%",
              animation: "spin 0.8s linear infinite", margin: "0 auto 8px",
            }} />
            Loading messages...
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div style={styles.noMessages}>
            <span style={{ fontSize: 28 }}>👋</span>
            <p>Start of your conversation with <strong>{contactName}</strong></p>
            <p style={{ fontSize: 12, opacity: 0.5, marginTop: 4 }}>Send a message to say hello!</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const senderId = typeof msg.sender === "object"
            ? (msg.sender._id || msg.sender.id) : msg.sender;
          const isMe = senderId === userId;
          const senderObj = typeof msg.sender === "object" ? msg.sender : null;
          const showAvatar = i === 0 || (() => {
            const prev = messages[i - 1];
            const prevId = typeof prev.sender === "object"
              ? (prev.sender._id || prev.sender.id) : prev.sender;
            return prevId !== senderId;
          })();

          const msgDate = new Date(msg.timestamp).toLocaleDateString();
          const showDate = msgDate !== lastDate;
          if (showDate) lastDate = msgDate;

          return (
            <div key={msg._id || `msg-${i}`}>
              {showDate && (
                <div style={styles.dateDivider}>
                  <span style={styles.dateDividerText}>{msgDate}</span>
                </div>
              )}
              <div style={{ ...styles.messageRow, flexDirection: isMe ? "row-reverse" : "row" }}>
                <div style={{ width: 32, minWidth: 32 }}>
                  {showAvatar && (
                    isMe
                      ? <Avatar firstName={user.firstName} lastName={user.lastName} color={user.color} size={32} />
                      : <Avatar
                          firstName={senderObj?.firstName || activeContact.firstName}
                          lastName={senderObj?.lastName || activeContact.lastName}
                          color={senderObj?.color || activeContact.color}
                          size={32}
                        />
                  )}
                </div>
                <div style={{ ...styles.bubble, ...(isMe ? styles.bubbleMe : styles.bubbleOther) }}>
                  {!isMe && showAvatar && senderObj && (
                    <div style={styles.senderName}>{senderObj.firstName} {senderObj.lastName}</div>
                  )}
                  <div style={styles.msgText}>{msg.content || msg.text}</div>
                  <div style={{ ...styles.msgTime, textAlign: isMe ? "right" : "left" }}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={styles.inputBar}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Type a message..."
          style={styles.messageInput}
          disabled={!connected}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || !connected}
          style={{ ...styles.sendBtn, opacity: input.trim() && connected ? 1 : 0.4 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

const styles = {
  emptyWrap: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#0d0d1a" },
  emptyInner: { textAlign: "center", padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: "#666", maxWidth: 300 },
  chatMain: { flex: 1, display: "flex", flexDirection: "column", background: "#0d0d1a", minWidth: 0 },
  chatHeader: {
    height: 60, padding: "0 20px", display: "flex", alignItems: "center", gap: 12,
    borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(20,20,37,0.6)",
  },
  headerName: { fontSize: 15, fontWeight: 700, color: "#fff" },
  headerMeta: { fontSize: 11, color: "#888" },
  offlineBanner: {
    marginLeft: "auto", background: "rgba(255,70,70,0.15)",
    border: "1px solid rgba(255,70,70,0.3)", borderRadius: 8,
    padding: "4px 12px", fontSize: 11, color: "#ff6b6b",
  },
  errorBanner: {
    background: "rgba(255,70,70,0.1)", borderBottom: "1px solid rgba(255,70,70,0.2)",
    padding: "8px 20px", fontSize: 13, color: "#ff6b6b",
    display: "flex", alignItems: "center", gap: 8,
  },
  errorClose: { marginLeft: "auto", background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: 16 },
  messagesArea: { flex: 1, overflowY: "auto", padding: "16px 20px" },
  loadingMsg: { textAlign: "center", color: "#888", fontSize: 13, padding: "40px 0" },
  noMessages: { textAlign: "center", padding: "60px 20px", color: "#888", fontSize: 14 },
  dateDivider: { textAlign: "center", padding: "16px 0 8px" },
  dateDividerText: { fontSize: 11, color: "#555", background: "#15152a", padding: "4px 14px", borderRadius: 20 },
  messageRow: { display: "flex", gap: 8, marginBottom: 4, alignItems: "flex-end" },
  bubble: { maxWidth: "65%", padding: "10px 14px", borderRadius: 16, animation: "fadeIn 0.15s ease" },
  bubbleMe: { background: "linear-gradient(135deg, #00cc4e, #00a83e)", borderBottomRightRadius: 4 },
  bubbleOther: { background: "#1e1e32", borderBottomLeftRadius: 4, border: "1px solid rgba(255,255,255,0.04)" },
  senderName: { fontSize: 11, fontWeight: 700, color: "#00ff62", marginBottom: 3 },
  msgText: { fontSize: 14, color: "#fff", lineHeight: 1.5, wordBreak: "break-word" },
  msgTime: { fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 4 },
  inputBar: {
    padding: "12px 20px 16px", display: "flex", gap: 10,
    background: "linear-gradient(180deg, transparent, rgba(20,20,37,0.8))",
  },
  messageInput: {
    flex: 1, height: 48, borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)", padding: "0 18px", fontSize: 14, color: "#fff",
    outline: "none", fontFamily: "'Quicksand', sans-serif",
  },
  sendBtn: {
    width: 48, height: 48, borderRadius: 14, border: "none",
    background: "linear-gradient(135deg, #00ff62, #00cc4e)", color: "#0a1a0d",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  },
};
