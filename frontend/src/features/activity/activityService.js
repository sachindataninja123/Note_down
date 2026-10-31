import api from "../../api/axiosInstance";

// GET /api/v1/activity?workspace=<id|personal>&before=<cursor>&limit=<n>
const getFeed = async (workspace, { before, limit = 20 } = {}) => {
  const response = await api.get("/activity", {
    params: { workspace: workspace || "personal", before, limit },
  });
  return response.data.data; // { items, nextCursor }
};

// GET /api/v1/tasks/:id/activity
const getTaskFeed = async (taskId, { before, limit = 10 } = {}) => {
  const response = await api.get(`/tasks/${taskId}/activity`, {
    params: { before, limit },
  });
  return response.data.data;
};

const activityService = { getFeed, getTaskFeed };
export default activityService;