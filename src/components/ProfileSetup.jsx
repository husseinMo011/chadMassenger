import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../services/apiClient";

export default function ProfileSetup() {
  const { user, updateProfile, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError("Both fields are required");
      return;
    }
    setLoading(true);
    setError("");

    try {
      await updateProfile(firstName.trim(), lastName.trim());
      navigate("/chat");
    } catch (err1) {
      console.error("Profile update attempt 1 failed:", err1);

      try {
        await apiClient.post("/api/auth/update-profile", {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });
        await refreshUser();
        navigate("/chat");
      } catch (err2) {
        console.error("Profile update attempt 2 failed:", err2);
        const msg =
          err2.response?.data?.message ||
          err2.response?.data ||
          err2.message ||
          "Server error";
        setError(
          typeof msg === "string"
            ? msg
            : `Request failed with status code ${err2.response?.status || "unknown"}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate("/chat");
  };

  return (
    <div style={styles.bg}>
      <div style={{ ...styles.card, animation: "slideUp 0.6s ease" }}>
        <div style={styles.header}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: "linear-gradient(135deg, #00ff62, #00ff6288)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 12px", fontSize: 28, fontWeight: 700, color: "#fff",
            boxShadow: "0 4px 20px #00ff6244",
          }}>
            {(firstName?.[0] || "?").toUpperCase()}
          </div>
          <h1 style={styles.title}>Set Up Your Profile</h1>
          <p style={styles.subtitle}>Tell us your name so others can find you</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>First Name</label>
            <input type="text" value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name" style={styles.input} required />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Last Name</label>
            <input type="text" value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name" style={styles.input} required />
          </div>

          {error && (
            <div style={styles.errorBanner}>
              <span>⚠</span> {error}
            </div>
          )}

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            <span style={styles.btnContent}>
              {loading ? "Saving..." : "Continue to Chat →"}
            </span>
          </button>

          {error && (
            <button type="button" onClick={handleSkip} style={styles.skipBtn}>
              Skip for now →
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

const styles = {
  bg: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "radial-gradient(ellipse at 20% 50%, #0a1a0d 0%, #0d0d1a 50%, #111118 100%)",
  },
  card: {
    width: 420, maxWidth: "92vw",
    background: "linear-gradient(145deg, #1a1a2e 0%, #16162a 50%, #1a1a2e 100%)",
    borderRadius: 20, padding: "40px 32px",
    boxShadow: "0 25px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  header: { textAlign: "center", marginBottom: 28 },
  title: { fontSize: 22, fontWeight: 800, color: "#fff" },
  subtitle: { fontSize: 13, color: "#888", marginTop: 8 },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  inputGroup: { textAlign: "left" },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#999", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" },
  input: {
    width: "100%", height: 46, borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)",
    padding: "0 14px", fontSize: 14, color: "#fff", outline: "none",
    fontFamily: "'Quicksand', sans-serif",
  },
  errorBanner: {
    background: "rgba(255,70,70,0.1)", border: "1px solid rgba(255,70,70,0.25)",
    borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#ff6b6b",
    display: "flex", alignItems: "center", gap: 8,
  },
  submitBtn: {
    height: 48, border: "none", borderRadius: 14, cursor: "pointer",
    background: "linear-gradient(135deg, #00ff62, #00cc4e)", marginTop: 6,
  },
  btnContent: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    fontSize: 15, fontWeight: 700, color: "#0a1a0d", fontFamily: "'Quicksand', sans-serif",
  },
  skipBtn: {
    height: 40, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12,
    cursor: "pointer", background: "transparent", color: "#888",
    fontSize: 13, fontWeight: 600, fontFamily: "'Quicksand', sans-serif",
  },
};
