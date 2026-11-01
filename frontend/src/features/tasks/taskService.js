import api from "../../api/axiosInstance";

// GET /api/v1/tasks
const getTasks = async (params = {}) => {
  const response = await api.get("/tasks", { params });
  return response.data;
};

// GET /api/v1/tasks/:id
const getTaskById = async (taskId) => {
  const response = await api.get(`/tasks/${taskId}`);
  return response.data;
};

// POST /api/v1/tasks
const createTask = async (taskData) => {
  const response = await api.post("/tasks", taskData);
  return response.data;
};

// PUT /api/v1/tasks/:id
const updateTask = async (taskId, taskData) => {
  const response = await api.put(`/tasks/${taskId}`, taskData);
  return response.data;
};

// PATCH /api/v1/tasks/:taskId/assign
const assignTask = async (taskId, userIds) => {
  const response = await api.patch(`/tasks/${taskId}/assign`, { userIds });
  return response.data;
};

// PATCH /api/v1/tasks/:id/toggle
const toggleTask = async (taskId) => {
  const response = await api.patch(`/tasks/${taskId}/toggle`);
  return response.data;
};

// PATCH /api/v1/tasks/:id/status  { status }
const updateTaskStatus = async (taskId, status) => {
  const response = await api.patch(`/tasks/${taskId}/status`, { status });
  return response.data;
};

// DELETE /api/v1/tasks/:id
const deleteTask = async (taskId) => {
  const response = await api.delete(`/tasks/${taskId}`);
  return { taskId, ...response.data };
};

// --- SUBTASKS ---

// POST /api/v1/tasks/:id/subtasks
const addSubtask = async (taskId, title) => {
  const response = await api.post(`/tasks/${taskId}/subtasks`, { title });
  return response.data;
};

// PATCH /api/v1/tasks/:id/subtasks/:subtaskId/toggle
const toggleSubtask = async (taskId, subtaskId) => {
  const response = await api.patch(
    `/tasks/${taskId}/subtasks/${subtaskId}/toggle`,
  );
  return response.data;
};

// DELETE /api/v1/tasks/:id/subtasks/:subtaskId
const deleteSubtask = async (taskId, subtaskId) => {
  const response = await api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
  return response.data;
};

// --- ATTACHMENTS ---

// POST /api/v1/tasks/:id/attachments (multipart/form-data)
const uploadAttachment = async (taskId, file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(`/tasks/${taskId}/attachments`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// DELETE /api/v1/tasks/:id/attachments/:attachmentId
const deleteAttachment = async (taskId, attachmentId) => {
  const response = await api.delete(
    `/tasks/${taskId}/attachments/${attachmentId}`,
  );
  return { attachmentId, ...response.data };
};

const taskService = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  toggleTask,
  updateTaskStatus,
  assignTask,
  deleteTask,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  uploadAttachment,
  deleteAttachment,
};

export default taskService;