import apiClient from "./apiClient";

// POST /api/auth/signup
export const signup = async (email, password) => {
  const response = await apiClient.post("/api/auth/signup", { email, password });
  return response.data;
};

// POST /api/auth/login
export const login = async (email, password) => {
  const response = await apiClient.post("/api/auth/login", { email, password });
  return response.data;
};

// POST /api/auth/logout
export const logout = async () => {
  const response = await apiClient.post("/api/auth/logout");
  return response.data;
};

// GET /api/auth/userinfo
export const getUserInfo = async () => {
  const response = await apiClient.get("/api/auth/userinfo");
  return response.data;
};

// POST /api/auth/update-profile
export const updateProfile = async (firstName, lastName, color) => {
  const payload = { firstName, lastName };
  if (color) payload.color = color;
  const response = await apiClient.post("/api/auth/update-profile", payload);
  return response.data;
};
