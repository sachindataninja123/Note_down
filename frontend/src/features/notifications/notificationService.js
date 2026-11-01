import api from "../../api/axiosInstance";

// GET /api/v1/notifications
const getNotifications = async () => {
  const response = await api.get("/notifications");
  return response.data;
};

// PATCH /api/v1/notifications/:id/read
const markAsRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
};

// PATCH /api/v1/notifications/read-all
const markAllAsRead = async () => {
  const response = await api.patch("/notifications/read-all");
  return response.data;
};

// GET / PATCH /api/v1/notifications/preferences
const getPreferences = async () => {
  const response = await api.get("/notifications/preferences");
  return response.data;
};

const updatePreferences = async (changes) => {
  const response = await api.patch("/notifications/preferences", changes);
  return response.data;
};

const notificationService = {
  getPreferences,
  updatePreferences,
  getNotifications,
  markAsRead,
  markAllAsRead,
};

export default notificationService;