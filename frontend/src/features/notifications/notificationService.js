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

const notificationService = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};

export default notificationService;