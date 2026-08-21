import api from "../../api/axiosInstance";

const getWorkspaces = async () => {
  const res = await api.get("/workspaces");
  return res.data;
};

const createWorkspace = async (workspaceData) => {
  const res = await api.post("/workspaces", workspaceData);
  return res.data;
};

const deleteWorkspace = async (workspaceId) => {
  const res = await api.delete(`/workspaces/${workspaceId}`);
  return res.data;
};

const addMember = async (workspaceId, memberData) => {
  const res = await api.post(`/workspaces/${workspaceId}/members`, memberData);
  return res.data;
};

const removeMember = async (workspaceId, memberId) => {
  const res = await api.delete(`/workspaces/${workspaceId}/members/${memberId}`);
  return res.data;
};

const workspaceService = {
  getWorkspaces,
  createWorkspace,
  deleteWorkspace,
  addMember,
  removeMember,
};

export default workspaceService;