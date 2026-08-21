import api from "../../api/axiosInstance";

const register = async (userData) => {
  const response = await api.post("/auth/register", userData);
  return response.data;
};

const login = async (userData) => {
  const response = await api.post("/auth/login", userData);
  return response.data;
};

const getProfile = async () => {
  const response = await api.get("/auth/profile");
  return response.data;
};

const logout = async () => {
  const response = await api.post("/auth/logout");
  return response.data;
};

const authService = {
  register,
  login,
  getProfile,
  logout,
};

export default authService;