import api from "../../api/axiosInstance";

const getComments = async (taskId) => {
  const response = await api.get(`/tasks/${taskId}/comments`);
  return response.data;
};

const addComment = async (taskId, text) => {
  const response = await api.post(`/tasks/${taskId}/comments`, { text });
  return response.data;
};

const deleteComment = async (taskId, commentId) => {
  const response = await api.delete(`/tasks/${taskId}/comments/${commentId}`);
  return { commentId, ...response.data };
};


const commentService = { getComments, addComment, deleteComment };
export default commentService;
