import { useState, useEffect, useRef } from "react";
import { useRoom } from "../context/RoomContext";
import { useAuth } from "../context/AuthContext";

function Avatar({ firstName, lastName, color, size = 38 }) {
  const initials = ((firstName?.[0] || "") + (lastName?.[0] || "")).toUpperCase() || "?";
  return (
    <div style={{
      width: size, height: size, minWidth: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${color || "#666"}, ${color || "#666"}88)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 700, color: "#fff",
      boxShadow: `0 2px 8px ${color || "#666"}33`,
    }}>
      {initials}
    </div>
  );
}

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diff < 604800000) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function ContactSidebar() {
  const { user } = useAuth();
  const {
    filteredContacts, activeContact, setActiveContact,
    deleteContact, setSearchQuery, searchQuery,
    searchResults, performSearch, loadAllUsers, allUsers,
    addOrUpdateContact, unreadCounts, lastMessages,
  } = useRoom();

  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState("");
  const searchTimeoutRef = useRef(null);

  // Debounced search for new chat
  useEffect(() => {
    if (!showNewChat) return;
    clearTimeout(searchTimeoutRef.current);
    if (newChatSearch.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(newChatSearch);
      }, 300);
    }
    return () => clearTimeout(searchTimeoutRef.current);
  }, [newChatSearch, showNewChat, performSearch]);

  // Load all users when opening new chat modal
  useEffect(() => {
    if (showNewChat) loadAllUsers();
  }, [showNewChat, loadAllUsers]);

  const handleStartChat = (contact) => {
    addOrUpdateContact({ ...contact, lastMessageTime: new Date().toISOString() });
    setActiveContact(contact);
    setShowNewChat(false);
    setNewChatSearch("");
  };

  const newChatUsers = newChatSearch.trim()
    ? searchResults.filter((c) => c._id !== user?.id && c._id !== user?._id)
    : allUsers.filter((c) => c.value !== user?.id && c.value !== user?._id);

  // Total unread count
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  return (
    <div style={styles.sidebar}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>
          Messages
          {totalUnread > 0 && (
            <span style={styles.totalBadge}>{totalUnread}</span>
          )}
        </h2>
        <button
          onClick={() => { if (showNewChat) setNewChatSearch(""); setShowNewChat(!showNewChat); }}
          style={styles.newBtn}
          title="New Conversation"
        >
          {showNewChat ? "✕" : "+"}
        </button>
      </div>

      {/* New Chat Panel */}
      {showNewChat && (
        <div style={styles.newChatPanel}>
          <input
            value={newChatSearch}
            onChange={(e) => setNewChatSearch(e.target.value)}
            placeholder="Search users by name..."
            style={styles.newChatInput}
            autoFocus
          />
          <div style={styles.newChatList}>
            {newChatUsers.length === 0 && (
              <div style={styles.emptyText}>
                {newChatSearch ? "No users found" : "Loading users..."}
              </div>
            )}
            {newChatUsers.map((c) => {
              const id = c._id || c.value;
              const name = c.label || `${c.firstName || ""} ${c.lastName || ""}`.trim();
              return (
                <div
                  key={id}
                  onClick={() => handleStartChat({
                    _id: id,
                    firstName: c.firstName || name.split(" ")[0] || "",
                    lastName: c.lastName || name.split(" ").slice(1).join(" ") || "",
                    email: c.email || "",
                    color: c.color || "#666",
                  })}
                  style={styles.newChatItem}
                >
                  <Avatar firstName={c.firstName || name.split(" ")[0]} lastName={c.lastName || name.split(" ")[1]} color={c.color} size={34} />
                  <div style={{ minWidth: 0 }}>
                    <div style={styles.contactName}>{name}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search */}
      <div style={styles.searchWrap}>
        <span style={styles.searchIcon}>🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter conversations..."
          style={styles.searchInput}
        />
      </div>

      {/* Contacts List */}
      <div style={styles.contactList}>
        {filteredContacts.length === 0 && (
          <div style={styles.emptyContacts}>
            <span style={{ fontSize: 32, display: "block", marginBottom: 8 }}>💬</span>
            {searchQuery ? "No matches found" : "No conversations yet"}
            <br />
            <span style={{ fontSize: 11, opacity: 0.6 }}>
              Click + to start a new chat
            </span>
          </div>
        )}
        {filteredContacts.map((contact) => {
          const isActive = activeContact?._id === contact._id;
          const name = `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || "Unknown";
          const unread = unreadCounts[contact._id] || 0;
          const lastMsg = lastMessages[contact._id];
          const previewText = lastMsg?.text || "";
          const previewTime = lastMsg?.timestamp || contact.lastMessageTime;

          return (
            <div
              key={contact._id}
              onClick={() => setActiveContact(contact)}
              style={{
                ...styles.contactItem,
                ...(isActive ? styles.contactItemActive : {}),
              }}
            >
              {/* Avatar with unread dot */}
              <div style={{ position: "relative" }}>
                <Avatar
                  firstName={contact.firstName}
                  lastName={contact.lastName}
                  color={contact.color}
                  size={42}
                />
                {unread > 0 && !isActive && (
                  <div style={styles.unreadDot}>
                    {unread > 9 ? "9+" : unread}
                  </div>
                )}
              </div>

              <div style={styles.contactInfo}>
                <div style={styles.contactNameRow}>
                  <span style={{
                    ...styles.contactName,
                    fontWeight: unread > 0 && !isActive ? 800 : 600,
                  }}>
                    {name}
                  </span>
                  {previewTime && (
                    <span style={{
                      ...styles.contactTime,
                      color: unread > 0 && !isActive ? "#00ff62" : "#666",
                    }}>
                      {formatTime(previewTime)}
                    </span>
                  )}
                </div>
                <div style={{
                  ...styles.previewText,
                  color: unread > 0 && !isActive ? "#ccc" : "#666",
                  fontWeight: unread > 0 && !isActive ? 600 : 400,
                }}>
                  {previewText
                    ? (previewText.length > 35 ? previewText.slice(0, 35) + "…" : previewText)
                    : "No messages yet"
                  }
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Delete conversation with ${name}?`)) {
                    deleteContact(contact._id);
                  }
                }}
                style={styles.deleteBtn}
                title="Delete conversation"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      <div style={styles.footer}>
        <span style={styles.footerText}>
          {filteredContacts.length} conversation{filteredContacts.length !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: 320, minWidth: 320,
    background: "linear-gradient(180deg, #141425 0%, #111120 100%)",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    display: "flex", flexDirection: "column", height: "100%",
  },
  header: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between", padding: "18px 18px 0",
  },
  title: {
    fontSize: 16, fontWeight: 700, color: "#fff",
    display: "flex", alignItems: "center", gap: 8,
  },
  totalBadge: {
    background: "#00ff62",
    color: "#0a1a0d",
    fontSize: 11,
    fontWeight: 800,
    padding: "2px 7px",
    borderRadius: 10,
    lineHeight: "16px",
  },
  newBtn: {
    width: 32, height: 32, borderRadius: 10,
    border: "1px solid rgba(0,255,98,0.3)",
    background: "rgba(0,255,98,0.08)",
    color: "#00ff62", fontSize: 18, fontWeight: 600,
    cursor: "pointer", display: "flex",
    alignItems: "center", justifyContent: "center", lineHeight: 1,
  },
  newChatPanel: {
    padding: "12px 14px 0",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    paddingBottom: 12,
  },
  newChatInput: {
    width: "100%", height: 36, borderRadius: 10,
    border: "1px solid rgba(0,255,98,0.2)",
    background: "rgba(0,255,98,0.04)",
    padding: "0 12px", fontSize: 13, color: "#fff",
    outline: "none", fontFamily: "'Quicksand', sans-serif",
    marginBottom: 8,
  },
  newChatList: { maxHeight: 200, overflowY: "auto" },
  newChatItem: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "8px 8px", borderRadius: 8, cursor: "pointer",
  },
  emptyText: {
    textAlign: "center", color: "#666", fontSize: 12, padding: "12px 0",
  },
  searchWrap: { padding: "14px 18px 8px", position: "relative" },
  searchIcon: {
    position: "absolute", left: 30, top: "50%",
    transform: "translateY(-50%)", fontSize: 13, opacity: 0.6, marginTop: 3,
  },
  searchInput: {
    width: "100%", height: 38, borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.03)",
    paddingLeft: 36, paddingRight: 12,
    fontSize: 13, color: "#fff", outline: "none",
    fontFamily: "'Quicksand', sans-serif",
  },
  contactList: { flex: 1, overflowY: "auto", padding: "4px 10px" },
  emptyContacts: {
    textAlign: "center", color: "#666", fontSize: 13, padding: "40px 20px",
  },
  contactItem: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "12px 10px", borderRadius: 12, cursor: "pointer",
    position: "relative", marginBottom: 2,
    transition: "background 0.15s",
  },
  contactItemActive: {
    background: "rgba(0,255,98,0.08)",
    boxShadow: "inset 3px 0 0 #00ff62",
  },
  unreadDot: {
    position: "absolute",
    top: -2, right: -4,
    minWidth: 18, height: 18,
    borderRadius: 9,
    background: "#00ff62",
    color: "#0a1a0d",
    fontSize: 10,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 4px",
    border: "2px solid #141425",
  },
  contactInfo: { flex: 1, minWidth: 0 },
  contactNameRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  contactName: {
    fontSize: 14, fontWeight: 600, color: "#fff",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  contactTime: { fontSize: 10, color: "#666", whiteSpace: "nowrap" },
  previewText: {
    fontSize: 12, color: "#666",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
    marginTop: 3,
  },
  deleteBtn: {
    position: "absolute", right: 6, top: 6,
    width: 22, height: 22, borderRadius: 6,
    border: "none", background: "transparent",
    color: "#666", fontSize: 14, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    opacity: 0.3,
  },
  footer: {
    padding: "12px 18px",
    borderTop: "1px solid rgba(255,255,255,0.04)",
  },
  footerText: { fontSize: 11, color: "#555" },
};
