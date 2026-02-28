import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";
import ContactSidebar from "./ContactSidebar";
import ChatWindow from "./ChatWindow";

// ─── NavBar ──────────────────────────────────────────────────────────────────
function NavBar() {
  const { user, logout, updateProfile } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const dropdownRef = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowProfile(false);
        setEditing(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleSave = async () => {
    if (firstName.trim() && lastName.trim()) {
      try {
        await updateProfile(firstName.trim(), lastName.trim());
        setEditing(false);
      } catch (err) {
        console.error("Failed to update profile:", err);
      }
    }
  };

  const initials = ((user?.firstName?.[0] || "") + (user?.lastName?.[0] || "")).toUpperCase() || "?";

  return (
    <div style={styles.navBar}>
      <div style={styles.navLeft}>
        <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
          <rect x="4" y="8" width="40" height="28" rx="4" fill="#00ff62" opacity="0.9"/>
          <rect x="8" y="12" width="32" height="20" rx="2" fill="#2d2d2d"/>
          <circle cx="18" cy="22" r="3" fill="#00ff62"/>
          <circle cx="30" cy="22" r="3" fill="#00ff62" opacity="0.5"/>
        </svg>
        <span style={styles.navTitle}>
          Chad<span style={{ color: "#00ff62" }}>Messenger</span>
        </span>
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: connected ? "#00ff62" : "#ff4444",
          marginLeft: 8,
        }} />
        <span style={styles.statusText}>{connected ? "Online" : "Offline"}</span>
      </div>

      <div style={{ position: "relative" }} ref={dropdownRef}>
        <button
          onClick={() => { setShowProfile(!showProfile); setEditing(false); }}
          style={styles.profileBtn}
        >
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            background: `linear-gradient(135deg, ${user?.color || "#00ff62"}, ${user?.color || "#00ff62"}88)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#fff",
          }}>
            {initials}
          </div>
          <span style={styles.navUserName}>{user?.firstName || "User"}</span>
          <span style={{ fontSize: 10, opacity: 0.5 }}>▼</span>
        </button>

        {showProfile && (
          <div style={styles.dropdown}>
            <div style={styles.dropdownHeader}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: `linear-gradient(135deg, ${user?.color || "#00ff62"}, ${user?.color || "#00ff62"}88)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 700, color: "#fff",
              }}>
                {initials}
              </div>
              <div>
                <div style={styles.dropdownName}>{user?.firstName} {user?.lastName}</div>
                <div style={styles.dropdownEmail}>{user?.email}</div>
              </div>
            </div>

            <div style={styles.divider} />

            {editing ? (
              <div style={styles.editSection}>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  style={styles.editInput}
                />
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  style={styles.editInput}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={handleSave} style={styles.saveBtn}>Save</button>
                  <button onClick={() => setEditing(false)} style={styles.cancelBtn}>Cancel</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setFirstName(user?.firstName || "");
                  setLastName(user?.lastName || "");
                  setEditing(true);
                }}
                style={styles.menuItem}
              >
                ✏️ Edit Profile
              </button>
            )}

            <button onClick={handleLogout} style={{ ...styles.menuItem, color: "#ff6b6b" }}>
              🚪 Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ChatLayout ──────────────────────────────────────────────────────────────
export default function ChatLayout() {
  return (
    <div style={styles.appContainer}>
      <NavBar />
      <div style={styles.chatLayout}>
        <ContactSidebar />
        <ChatWindow />
      </div>
    </div>
  );
}

const styles = {
  appContainer: {
    height: "100vh", display: "flex", flexDirection: "column",
    background: "#0d0d1a", fontFamily: "'Quicksand', sans-serif", color: "#fff",
  },
  chatLayout: { flex: 1, display: "flex", overflow: "hidden" },
  navBar: {
    height: 56,
    background: "linear-gradient(180deg, #1a1a2e 0%, #151528 100%)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 20px", position: "relative", zIndex: 100,
  },
  navLeft: { display: "flex", alignItems: "center", gap: 10 },
  navTitle: { fontSize: 16, fontWeight: 800, color: "#fff" },
  statusText: { fontSize: 11, color: "#888" },
  profileBtn: {
    display: "flex", alignItems: "center", gap: 8,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 12, padding: "4px 12px 4px 4px",
    cursor: "pointer", color: "#fff",
    fontFamily: "'Quicksand', sans-serif",
  },
  navUserName: { fontSize: 13, fontWeight: 600 },
  dropdown: {
    position: "absolute", top: 44, right: 0,
    width: 260, background: "#1e1e32",
    borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
    padding: 12, zIndex: 200, animation: "fadeIn 0.15s ease",
  },
  dropdownHeader: {
    display: "flex", alignItems: "center", gap: 12, padding: "8px 4px",
  },
  dropdownName: { fontSize: 14, fontWeight: 700, color: "#fff" },
  dropdownEmail: { fontSize: 11, color: "#888" },
  divider: { height: 1, background: "rgba(255,255,255,0.06)", margin: "10px 0" },
  menuItem: {
    display: "flex", alignItems: "center", gap: 10,
    width: "100%", padding: "10px 8px", background: "none",
    border: "none", borderRadius: 8, color: "#ccc",
    fontSize: 13, fontWeight: 500, cursor: "pointer",
    fontFamily: "'Quicksand', sans-serif", textAlign: "left",
  },
  editSection: {
    display: "flex", flexDirection: "column", gap: 8, padding: "4px 4px 8px",
  },
  editInput: {
    height: 36, borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    padding: "0 10px", fontSize: 13, color: "#fff",
    outline: "none", fontFamily: "'Quicksand', sans-serif",
  },
  saveBtn: {
    flex: 1, height: 34, borderRadius: 8, border: "none",
    background: "#00ff62", color: "#0a1a0d",
    fontWeight: 700, fontSize: 12, cursor: "pointer",
    fontFamily: "'Quicksand', sans-serif",
  },
  cancelBtn: {
    flex: 1, height: 34, borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "transparent", color: "#888",
    fontWeight: 600, fontSize: 12, cursor: "pointer",
    fontFamily: "'Quicksand', sans-serif",
  },
};
