import { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in (JWT cookie exists)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await authService.getUserInfo();
        // Backend returns user data directly from /api/auth/userinfo
        setUser(data);
      } catch (err) {
        // Not authenticated — that's fine
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    return data.user;
  }, []);

  const signup = useCallback(async (email, password) => {
    const data = await authService.signup(email, password);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      // logout anyway on client
    }
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (firstName, lastName, color) => {
    const data = await authService.updateProfile(firstName, lastName, color);
    // Backend returns updated user — could be in data or data.user
    const updated = data.user || data;
    setUser(updated);
    return updated;
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await authService.getUserInfo();
      setUser(data);
    } catch (err) {
      // ignore
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateProfile, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
