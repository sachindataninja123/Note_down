import api from "../../api/axiosInstance";

// GET /api/v1/workspaces
const getWorkspaces = async () => {
  const response = await api.get("/workspaces");
  return response.data;
};

// POST /api/v1/workspaces
const createWorkspace = async (workspaceData) => {
  const response = await api.post("/workspaces", workspaceData);
  return response.data;
};

// POST /api/v1/workspaces/:id/members
const addMember = async (workspaceId, { email, role }) => {
  const response = await api.post(`/workspaces/${workspaceId}/members`, { email, role });
  return response.data;
};

// DELETE /api/v1/workspaces/:id/members/:memberId
const removeMember = async (workspaceId, memberId) => {
  const response = await api.delete(`/workspaces/${workspaceId}/members/${memberId}`);
  return response.data;
};

const workspaceService = {
  getWorkspaces,
  createWorkspace,
  addMember,
  removeMember,
};

export default workspaceService;