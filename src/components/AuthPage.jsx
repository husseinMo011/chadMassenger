import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = isLogin ? await login(email, password) : await signup(email, password);
      // If profile not set up, go to profile page, otherwise go to chat
      if (user && user.profileSetup) {
        navigate("/chat");
      } else {
        navigate("/profile");
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || err.message || "Something went wrong";
      setError(typeof msg === "string" ? msg : "Something went wrong");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.bg}>
      {/* Floating particles */}
      <div style={styles.particleField}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            width: 6, height: 6,
            borderRadius: "50%",
            background: "#00ff62",
            opacity: 0.3,
            left: `${8 + i * 7.5}%`,
            animation: `float ${3 + (i % 3)}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
          }} />
        ))}
      </div>

      <div style={{
        ...styles.card,
        animation: shake ? "shake 0.5s ease" : "slideUp 0.6s ease",
      }}>
        {/* Logo */}
        <div style={styles.logoSection}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect x="4" y="8" width="40" height="28" rx="4" fill="#00ff62" opacity="0.9"/>
            <rect x="8" y="12" width="32" height="20" rx="2" fill="#2d2d2d"/>
            <circle cx="18" cy="22" r="3" fill="#00ff62"/>
            <circle cx="30" cy="22" r="3" fill="#00ff62" opacity="0.5"/>
            <rect x="14" y="36" width="20" height="4" rx="2" fill="#00ff62" opacity="0.6"/>
          </svg>
          <h1 style={styles.logoText}>
            Chad<span style={{ color: "#00ff62" }}>Messenger</span>
          </h1>
          <p style={styles.tagline}>
            {isLogin ? "Welcome back! Sign in to continue" : "Create your account to get started"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <div style={styles.inputWrap}>
              <span style={styles.icon}>✉</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrap}>
              <span style={styles.icon}>🔒</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.input}
                required
              />
            </div>
          </div>

          {error && (
            <div style={styles.errorBanner}>
              <span>⚠</span> {error}
            </div>
          )}

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            <span style={styles.btnContent}>
              {loading ? (
                <span style={{
                  width: 20, height: 20,
                  border: "2px solid transparent",
                  borderTop: "2px solid #0a1a0d",
                  borderRadius: "50%",
                  animation: "spin 0.6s linear infinite",
                  display: "inline-block",
                }} />
              ) : (
                <>{isLogin ? "Sign In" : "Create Account"} <span style={{ fontSize: 18 }}>→</span></>
              )}
            </span>
          </button>
        </form>

        <div style={styles.switchSection}>
          <span style={{ fontSize: 13, color: "#666" }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </span>
          <button
            onClick={() => { setIsLogin(!isLogin); setError(""); }}
            style={styles.switchBtn}
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </div>

        <div style={styles.footer}>
          <span style={styles.dot} />
          <span style={{ fontSize: 11, color: "#444" }}>Inspired by MSN & Yahoo Messenger</span>
          <span style={styles.dot} />
        </div>
      </div>
    </div>
  );
}

const styles = {
  bg: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "radial-gradient(ellipse at 20% 50%, #0a1a0d 0%, #0d0d1a 50%, #111118 100%)",
    position: "relative",
    overflow: "hidden",
  },
  particleField: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    overflow: "hidden",
  },
  card: {
    width: 420,
    maxWidth: "92vw",
    background: "linear-gradient(145deg, #1a1a2e 0%, #16162a 50%, #1a1a2e 100%)",
    borderRadius: 20,
    padding: "40px 32px",
    boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(0,255,98,0.06), inset 0 1px 0 rgba(255,255,255,0.05)",
    position: "relative",
    zIndex: 1,
    border: "1px solid rgba(255,255,255,0.06)",
  },
  logoSection: { textAlign: "center", marginBottom: 28 },
  logoText: { fontSize: 26, fontWeight: 800, color: "#fff", margin: "12px 0 0" },
  tagline: { fontSize: 13, color: "#888", marginTop: 8 },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  inputGroup: { textAlign: "left" },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#999", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" },
  inputWrap: { position: "relative" },
  icon: { position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, opacity: 0.5 },
  input: {
    width: "100%", height: 46, borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    paddingLeft: 42, paddingRight: 14,
    fontSize: 14, color: "#fff", outline: "none",
    fontFamily: "'Quicksand', sans-serif",
  },
  errorBanner: {
    background: "rgba(255,70,70,0.1)",
    border: "1px solid rgba(255,70,70,0.25)",
    borderRadius: 10, padding: "10px 14px",
    fontSize: 13, color: "#ff6b6b",
    display: "flex", alignItems: "center", gap: 8,
  },
  submitBtn: {
    height: 48, border: "none", borderRadius: 14, cursor: "pointer",
    background: "linear-gradient(135deg, #00ff62, #00cc4e)",
    marginTop: 6,
  },
  btnContent: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    fontSize: 15, fontWeight: 700, color: "#0a1a0d",
    fontFamily: "'Quicksand', sans-serif",
  },
  switchSection: {
    marginTop: 24, textAlign: "center",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  },
  switchBtn: {
    background: "none", border: "none", color: "#00ff62",
    fontWeight: 700, fontSize: 13, cursor: "pointer",
    fontFamily: "'Quicksand', sans-serif",
  },
  footer: {
    marginTop: 24, display: "flex",
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  dot: { width: 4, height: 4, borderRadius: "50%", background: "#333" },
};
