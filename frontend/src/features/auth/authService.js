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

const updateProfilePic = async (formData) => {
  const response = await api.put("/auth/profile-image", formData);
  return response.data;
};

const deleteProfilePic = async () => {
  const response = await api.delete("/auth/profile-image");
  return response.data;
};

const forgotPassword = async (emailData) => {
  const payload =
    typeof emailData === "string" ? { email: emailData } : emailData;

  const response = await api.post("/auth/forgot-password", payload);
  return response.data;
};

const verifyOtp = async ({ email, otp }) => {
  const response = await api.post("/auth/verify-otp", { email, otp });
  return response.data;
};

const resetPassword = async ({ resetToken, newPassword }) => {
  const response = await api.post("/auth/reset-password", {
    resetToken,
    newPassword,
  });
  return response.data;
};

const changePassword = async ({ oldPassword, newPassword }) => {
  const response = await api.post("/auth/change-password", {
    oldPassword,
    newPassword,
  });
  return response.data;
};

const authService = {
  register,
  login,
  getProfile,
  logout,
  updateProfilePic,
  deleteProfilePic,
  forgotPassword,
  verifyOtp,
  resetPassword,
  changePassword,
};

export default authService;
