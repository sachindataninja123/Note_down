import api from "../../api/axiosInstance";

const getTasks = async (params = {}) => {
  const response = await api.get("/tasks", { params });
  return response.data;
};

const createTask = async (taskData) => {
  const response = await api.post("/tasks", taskData);
  return response.data;
};

const toggleTask = async (taskId) => {
  const response = await api.patch(`/tasks/${taskId}/toggle`);
  return response.data;
};

const deleteTask = async (taskId) => {
  const response = await api.delete(`/tasks/${taskId}`);
  return { taskId, ...response.data };
};

const addSubtask = async (taskId, title) => {
  const response = await api.post(`/tasks/${taskId}/subtasks`, { title });
  return response.data;
};

const toggleSubtask = async (taskId, subtaskId) => {
  const response = await api.patch(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`);
  return response.data;
};

const deleteSubtask = async (taskId, subtaskId) => {
  const response = await api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
  return response.data;
};

const taskService = {
  getTasks,
  createTask,
  toggleTask,
  deleteTask,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
};

export default taskService;